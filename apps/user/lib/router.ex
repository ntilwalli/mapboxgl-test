defmodule User.Router do
  use GenServer

  def start_link(opts \\ []) do
      GenServer.start_link(__MODULE__, :ok, opts)
  end

  def route(router, message) do
      GenServer.call({:route, message})
  end

  def init(:ok) do
      auth = %{}
      anon = %{}
      {:ok, {auth, anon}}
  end

  def handle_call({:route, %{:token => token, :message => message} = info}, from, {auth, anon} = state) do
    case Map.get(anon, token) do
      {:ok, pid} -> 
          User.Anon.route(pid, {from, message})
          {:noreply, state}
      {:error} -> 
          {:ok, pid} = User.Anon.Supervisor.start_user()
          anon = Map.put(anon, token, pid)
          User.Anon.route(pid, {from, message})
          {:noreply, {auth, anon}}
    end
  end
end