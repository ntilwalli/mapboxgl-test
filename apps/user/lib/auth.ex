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

  def handle_call(%{"route" => "/listing/save", "data" => %{"id" => id} = listing}, _from, state) do
    IO.puts "Got listing with id"
    IO.inspect listing
    {:reply, {:ok, %{type: "success"}}, state}
  end
  
  def handle_call(%{"route" => "/listing/save", "data" => %{"id" => nil} = listing}, _from, state) do
    IO.puts "Got listing with nil id"
    IO.inspect listing
    {:reply, {:ok, %{type: "success"}}, state}
  end

  def handle_call(%{"route" => "/listing/save", "data" => listing}, _from, state) do
    IO.puts "Got listing with no id"
    IO.inspect listing
    {:reply, {:ok, %{type: "success"}}, state}
  end

end