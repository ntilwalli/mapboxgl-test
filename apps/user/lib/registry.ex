defmodule User.Registry do
  use GenServer
  require Logger

  alias Shared.User, as: UserTable

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  def register_app_load(router, info) do
    GenServer.call(router, {:register_app_load, info})
  end

  def create_auth_process(router, user_id) do
    GenServer.call(router, {:create_auth_process, user_id})
  end

  def get_process(router, info) do
    GenServer.call(router, {:get_process, info})
  end

  defp add_auth_process(user, %{auth: auth, auth_ref: auth_ref} = state) do
    {:ok, pid} = User.Auth.Supervisor.start_user(user)
    ref = Process.monitor(pid)
    user_id = user.id
    auth = Map.put(auth, user_id, pid)
    auth_ref = Map.put(auth_ref, ref, user_id)
    %{%{state | auth: auth} | auth_ref: auth_ref}
  end

  def init(:ok) do
    auth = %{}
    auth_ref = %{}
    anon = %{}
    anon_ref = %{}
    
    state = %{auth: auth, anon: anon, auth_ref: auth_ref, anon_ref: anon_ref}
    users = Shared.Repo.all(UserTable)
    state = Enum.reduce(users, state, &add_auth_process/2)
    {:ok, state}
  end

  def handle_call({:get_process, %{anonymous_id: anonymous_id}}, _from, %{anon: anon} = state) do
    {:reply, Map.get(anon, anonymous_id), state}
  end

  def handle_call({:get_process, %{user_id: user_id}}, _from, %{auth: auth} = state) do
    {:reply, Map.get(auth, user_id), state}
  end

  def handle_call({:create_auth_process, user}, _from, %{auth: auth} = state) do
    user_id = user.id
    case Map.get(auth, user_id) do
      nil -> 
        user = Shared.Repo.get(Shared.User, user)
        add_auth_process(user, state)
      pid -> 
        {:reply, user_id, state}
    end
  end

  def handle_call({:register_app_load, %{:user_id => user_id, :anonymous_id => anonymous_id}}, _from, state) do
    {:reply, nil, state}
  end

  def handle_call({:register_app_load, %{:anonymous_id => anonymous_id}}, _from, %{anon: anon, anon_ref: anon_ref} = state) do
    # IO.puts "Handling anonymous register"
    case anonymous_id do
      nil -> 
        # Logger.debug "Generating new UUID..."
        uuid = to_string(Ecto.UUID.autogenerate())
        {:ok, pid} = User.Anon.Supervisor.start_user(uuid)
        ref = Process.monitor(pid)
        # IO.puts "Adding anon process..."
        # IO.inspect pid
        anon = Map.put(anon, uuid, pid)
        anon_ref = Map.put(anon_ref, ref, uuid)
        {:reply, uuid, %{%{state | anon: anon} | anon_ref: anon_ref}}
      a_id ->
        # IO.puts "Using existing anonymous_id: #{a_id}"
        case Map.get(anon, a_id) do
          nil -> 
            {:ok, pid} = User.Anon.Supervisor.start_user(a_id)
            ref = Process.monitor(pid)
            # IO.puts "Creating new PID with existing a_id"
            # IO.inspect pid
            anon = Map.put(anon, a_id, pid)
            anon_ref = Map.put(anon_ref, ref, a_id)
            {:reply, a_id, %{%{state | anon: anon} | anon_ref: anon_ref}}
          pid -> 
            #   IO.puts "Existing anonymous PID"
            #   IO.inspect pid
            {:reply, a_id, state}
        end
    end
  end

  def handle_info({:DOWN, ref, :process, _pid, _reason}, %{auth: auth, anon: anon, auth_ref: auth_ref, anon_ref: anon_ref} = state) do
    cond do  
      Map.has_key(anon_ref, ref) ->
        anon_id = Map.fetch!(anon_ref, ref)
        anon_ref = Map.delete(anon_ref, ref)
        anon = Map.delete(anon, anon_id)
        {:noreply, %{%{state | anon: anon} | anon_ref: anon_ref}}
      Map.has_key(auth_ref, ref) ->
        user_id = Map.fetch!(auth_ref, ref)
        auth_ref = Map.delete(auth_ref, ref)
        auth = Map.delete(auth, user_id)
        {:noreply, %{%{state | auth: auth} | auth_ref: auth_ref}}
      true -> {:noreply, state}
    end
  end
end