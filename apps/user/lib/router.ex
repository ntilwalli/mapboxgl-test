defmodule User.Router do
  use GenServer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  def route(router, message) do
    GenServer.call(router, {:route, message})
  end

  def init(:ok) do
    {:ok, nil}
  end

  def handle_call({:route, {%{anonymous_id: anonymous_id} = user_info, message}}, _from, state) do
    out = User.Registry.get_process(User.Registry, user_info)
    IO.puts "Anonymous route..."
    IO.inspect out
    case out do
      pid -> 
          {:reply, User.Anon.route(pid, message), state}
      nil -> 
          {:reply, {:error, "Could not find anonymous process: #{anonymous_id}"}, state}
    end
  end

  def handle_call({:route, {%{user_id: user_id} = user_info, message}}, _from, state) do
    out = User.Registry.get_process(User.Registry, user_info)
    case out do
      pid -> 
          {:reply, User.Auth.route(pid, message), state}
      nil -> 
          {:reply, {:error, "Could not find user process: #{user_id}"}, state}
    end
  end
end