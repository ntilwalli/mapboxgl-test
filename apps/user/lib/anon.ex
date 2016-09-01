defmodule User.Anon do
  use GenServer
  
  def start_link do
    GenServer.start_link(__MODULE__, :ok, [])
  end

  def route(server, message) do
    GenServer.call(server, message)
  end

  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:login, info}, _from, state) do
    out = Auth.Manager.login(Auth.Manager, info)
    {:reply, out, state}
  end

  def handle_call({:oauth_login, info}, _from, state) do
    out = Auth.Manager.oauth_login(Auth.Manager, info)
    {:reply, out, state}
  end

  def handle_call({:signup, info}, _from, state) do
    out = Auth.Manager.signup(Auth.Manager, info)
    case out do
      {:ok, user} -> 
        User.Registry.create_auth_process(User.Registry, user)
        {:reply, out, state}
      _ -> 
        {:reply, out, state}
    end
  end

  def handle_call({:oauth_signup, info}, _from, state) do
    out = Auth.Manager.oauth_signup(Auth.Manager, info)
    case out do
      {:ok, user} -> 
        IO.puts "Handling oauth signup"
        User.Registry.create_auth_process(User.Registry, user)
        {:reply, out, state}
      _ -> 
        {:reply, out, state}
    end
  end

end