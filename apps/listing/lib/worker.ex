defmodule Listing.Worker do
  use GenServer

  def start_link() do
    GenServer.start_link(__MODULE__, :ok, [])
  end

  def init(:ok) do
    {:ok, []}
  end

  def handle_call({:bulk, add, remove, update}, _, _) do
    
  end

  defp recursive_remove() do
    
  end
end