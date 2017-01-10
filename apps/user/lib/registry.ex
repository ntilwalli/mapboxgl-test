defmodule User.Registry do
  use GenServer
  require Logger

  alias Shared.User, as: UserTable

  def start_link(name, anon_supervisor, individual_supervisor) do
    GenServer.start_link(__MODULE__, {:ok, anon_supervisor, individual_supervisor}, name: name)
  end

  def register_app_load(router, info) do
    GenServer.call(router, {:register_app_load, info})
  end

  def create_individual_process(router, user_id) do
    GenServer.call(router, {:create_individual_process, user_id})
  end

  def lookup_anonymous(server, anonymous_id) do
    GenServer.call(server, {:lookup_anonymous, anonymous_id})
  end

  def lookup_user(server, %Shared.User{} = user) do
    GenServer.call(server, {:lookup_user, user})
  end

  def init({:ok, anon_supervisor, individuals_supervisor}) do
    individuals = %{}
    individuals_ref = %{}
    anon = %{}
    anon_ref = %{}
    
    state = %{
      anon_supervisor: anon_supervisor, 
      individuals_supervisor: individuals_supervisor, 
      individuals: individuals, 
      anon: anon, 
      individuals_ref: individuals_ref, 
      anon_ref: anon_ref
    }

    users = Shared.Repo.all(UserTable)
    state = Enum.reduce(users, state, &add_individual_process/2)
    {:ok, state}
  end

  def handle_call({:lookup_user, %Shared.User{id: user_id}}, _from, %{individuals: individuals} = state) do
    {:reply, {:ok, Map.get(individuals, user_id)}, state}
  end

  def handle_call({:lookup_anonymous, anonymous_id}, _from, %{anon: anon} = state) do
    case anon[anonymous_id] do
      nil ->
        new_state = start_anonymous_user(anonymous_id, state)
        %{anon: anon} = new_state
        pid = anon[anonymous_id]
        {:reply, {:ok, pid}, new_state}
      pid -> 
        {:reply, {:ok, pid}, state}
    end
  end

  def handle_call({:create_individual_process, user}, _from, %{individuals: individuals} = state) do
    user_id = user.id
    case Map.get(individuals, user_id) do
      nil -> 
        user = Shared.Repo.get(Shared.User, user_id)
        new_state = add_individual_process(user, state)
        {:reply, user_id, new_state}
      pid -> 
        {:reply, user_id, state}
    end
  end

  def handle_info({:DOWN, ref, :process, _pid, reason}, %{anon_supervisor: anon_supervisor, individuals: individuals, anon: anon, individuals_ref: individuals_ref, anon_ref: anon_ref} = state) do
    case reason do
      :normal ->
        cond do
          Map.has_key?(anon_ref, ref) ->
            anon_id = Map.fetch!(anon_ref, ref)
            anon_ref = Map.delete(anon_ref, ref)
            anon = Map.delete(anon, anon_id)
            {:noreply, %{%{state | anon: anon} | anon_ref: anon_ref}}
          Map.has_key?(individuals_ref, ref) ->
            user_id = Map.fetch!(individuals_ref, ref)
            individuals_ref = Map.delete(individuals_ref, ref)
            individuals = Map.delete(individuals, user_id)
            {:noreply, %{%{state | individuals: individuals} | individuals_ref: individuals_ref}}
          true -> {:noreply, state}
        end
      _ ->
        cond do
          Map.has_key?(anon_ref, ref) ->
            anon_id = Map.fetch!(anon_ref, ref)
            anon_ref = Map.delete(anon_ref, ref)
            anon = Map.delete(anon, anon_id)

            {:ok, pid} = User.Anon.Supervisor.start_user(anon_supervisor, anon_id)
            ref = Process.monitor(pid)
            anon = Map.put(anon, anon_id, pid)
            anon_ref = Map.put(anon_ref, ref, anon_id)

            {:noreply, %{%{state | anon: anon} | anon_ref: anon_ref}}
          Map.has_key?(individuals_ref, ref) ->
            user_id = Map.fetch!(individuals_ref, ref)
            individuals_ref = Map.delete(individuals_ref, ref)
            individuals = Map.delete(individuals, user_id)

            user = Shared.Repo.get(Shared.User, user_id)
            new_state = add_individual_process(user, state)
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

  defp add_individual_process(user, %{individuals_supervisor: individuals_supervisor, individuals: individuals, individuals_ref: individuals_ref} = state) do
    {:ok, pid} = User.Individual.Supervisor.start_user(individuals_supervisor, user)
    ref = Process.monitor(pid)
    user_id = user.id

    individuals = Map.put(individuals, user_id, pid)

    individuals_ref = Map.put(individuals_ref, ref, user_id)
    new_state = %{state | individuals: individuals, individuals_ref: individuals_ref}
    new_state
  end

end