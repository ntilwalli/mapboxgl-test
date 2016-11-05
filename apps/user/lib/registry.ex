defmodule User.Registry do
  use GenServer
  require Logger

  alias Shared.User, as: UserTable

  def start_link(name, anon_supervisor, auth_supervisor) do
    IO.puts "Name: #{name}"
    GenServer.start_link(__MODULE__, {:ok, anon_supervisor, auth_supervisor}, name: name)
  end

  def register_app_load(router, info) do
    GenServer.call(router, {:register_app_load, info})
  end

  def create_auth_process(router, user_id) do
    GenServer.call(router, {:create_auth_process, user_id})
  end

  def lookup(server, user) do
    GenServer.call(server, {:lookup, user})
  end

  def search(server, user, query) do
    IO.puts "Search server: #{server}"
    GenServer.call(server, {:search, user, query})
    #{:ok, []}
  end

  defp add_auth_process(user, %{auth_supervisor: auth_supervisor, auth: auth, auth_ref: auth_ref} = state) do
    {:ok, pid} = User.Auth.Supervisor.start_user(auth_supervisor, user)
    ref = Process.monitor(pid)
    user_id = user.id
    # IO.puts "Old auth"
    # IO.inspect auth
    auth = Map.put(auth, user_id, pid)

    auth_ref = Map.put(auth_ref, ref, user_id)
    new_state = %{state | auth: auth, auth_ref: auth_ref}
    # IO.puts "New auth"
    # IO.inspect new_state.auth
    new_state
  end

  def init({:ok, anon_supervisor, auth_supervisor}) do
    auth = %{}
    auth_ref = %{}
    anon = %{}
    anon_ref = %{}
    
    state = %{
      anon_supervisor: anon_supervisor, 
      auth_supervisor: auth_supervisor, 
      auth: auth, 
      anon: anon, 
      auth_ref: auth_ref, 
      anon_ref: anon_ref
    }

    users = Shared.Repo.all(UserTable)
    state = Enum.reduce(users, state, &add_auth_process/2)
    {:ok, state}
  end

  def handle_call({:lookup, %{anonymous_id: anonymous_id}}, _from, %{anon: anon} = state) do
    {:reply, {:ok, Map.get(anon, anonymous_id)}, state}
  end

  def handle_call({:lookup, %{user_id: user_id}}, _from, %{auth: auth} = state) do
    {:reply, {:ok, Map.get(auth, user_id)}, state}
  end

  def handle_call({:create_auth_process, user}, _from, %{auth: auth} = state) do
    user_id = user.id
    case Map.get(auth, user_id) do
      nil -> 
        # IO.puts "Adding new user, old state"
        #IO.inspect state
        user = Shared.Repo.get(Shared.User, user_id)
        new_state = add_auth_process(user, state)
        # IO.puts "Adding new user, new state"
        # IO.inspect new_state
        {:reply, user_id, new_state}
      pid -> 
        {:reply, user_id, state}
    end
  end

  def handle_call({:register_app_load, %{:user_id => user_id, :anonymous_id => anonymous_id}}, _from, state) do
    {:reply, nil, state}
  end

  def handle_call({:register_app_load, %{:anonymous_id => anonymous_id}}, _from, %{anon_supervisor: anon_supervisor, anon: anon, anon_ref: anon_ref} = state) do
    # IO.puts "Handling anonymous register"
    case anonymous_id do
      nil -> 
        # Logger.debug "Generating new UUID..."
        uuid = to_string(Ecto.UUID.autogenerate())
        {:ok, pid} = User.Anon.Supervisor.start_user(anon_supervisor, uuid)
        ref = Process.monitor(pid)
        # IO.puts "Adding anon process..."
        # IO.inspect pid
        anon = Map.put(anon, uuid, pid)
        anon_ref = Map.put(anon_ref, ref, uuid)
        {:reply, uuid, %{state | anon: anon, anon_ref: anon_ref}}
      a_id ->
        # IO.puts "Using existing anonymous_id: #{a_id}"
        case Map.get(anon, a_id) do
          nil -> 
            {:ok, pid} = User.Anon.Supervisor.start_user(anon_supervisor, a_id)
            ref = Process.monitor(pid)
            # IO.puts "Creating new PID with existing a_id"
            # IO.inspect pid
            anon = Map.put(anon, a_id, pid)
            anon_ref = Map.put(anon_ref, ref, a_id)
            {:reply, a_id, %{state | anon: anon, anon_ref: anon_ref}}
          pid -> 
            #   IO.puts "Existing anonymous PID"
            #   IO.inspect pid
            {:reply, a_id, state}
        end
    end
  end

  def handle_call({:search, user, query}, _from, %{auth: auth, anon: anon} = state) do
    case user do
      %{user_id: user_id} ->
        pid = auth[user_id]
        {:reply, User.Auth.search(pid, query), state}
      %{anonymous_id: anonymous_id} ->
        case anon[anonymous_id] do
          nil ->
            new_state = start_anonymous_user(anonymous_id, state)
            %{anon: anon} = new_state
            pid = anon[anonymous_id]
            out = User.Anon.search(pid, query)
            {:reply, out, new_state}
          pid -> 
            out = User.Anon.search(pid, query)
            {:reply, out, state}
        end
    end
  end

  def handle_info({:DOWN, ref, :process, _pid, reason}, %{anon_supervisor: anon_supervisor, auth: auth, anon: anon, auth_ref: auth_ref, anon_ref: anon_ref} = state) do
    case reason do
      :normal ->
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
      _ ->
        cond do
          Map.has_key(anon_ref, ref) ->
            anon_id = Map.fetch!(anon_ref, ref)
            anon_ref = Map.delete(anon_ref, ref)
            anon = Map.delete(anon, anon_id)

            {:ok, pid} = User.Anon.Supervisor.start_user(anon_supervisor, anon_id)
            ref = Process.monitor(pid)
            anon = Map.put(anon, anon_id, pid)
            anon_ref = Map.put(anon_ref, ref, anon_id)

            {:noreply, %{%{state | anon: anon} | anon_ref: anon_ref}}
          Map.has_key(auth_ref, ref) ->
            user_id = Map.fetch!(auth_ref, ref)
            auth_ref = Map.delete(auth_ref, ref)
            auth = Map.delete(auth, user_id)

            user = Shared.Repo.get(Shared.User, user_id)
            new_state = add_auth_process(user, state)
            {:noreply, new_state}
          true -> {:noreply, state}
        end
    end
  end

  defp start_anonymous_user(a_id, %{anon_supervisor: anon_supervisor, anon: anon, anon_ref: anon_ref} = state) do
    {:ok, pid} = User.Anon.Supervisor.start_user(anon_supervisor, a_id)
    ref = Process.monitor(pid)
    anon = Map.put(anon, a_id, pid)
    anon_ref = Map.put(anon_ref, ref, a_id)
    %{%{state | anon: anon} | anon_ref: anon_ref}
  end
end