defmodule Listing.Worker do
  use GenServer

  def start_link() do
    GenServer.start_link(__MODULE__, :ok, [])
  end

  def init(:ok) do
    {:ok, []}
  end

  def handle_call(msg, _, _) do
    
  end
end