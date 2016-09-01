defmodule User.Auth do
  use GenServer
  
  def start_link(args, opts \\ []) do
    IO.puts "Printing"
    IO.inspect args
    GenServer.start_link(__MODULE__, args, [])
  end

  def route(server, message) do
    GenServer.call(server, message)
  end

  def init([{:user, user}] = args) do
    {:ok, %{
      user: user
    }}
  end

  def handle_call(%{route: "/listing/save", data: %{id: nil} = listing}, _from, state) do
    
  end
  
  def handle_call(%{route: "/listing/save", data: %{id: _} = listing}, _from, state) do
    
  end

end