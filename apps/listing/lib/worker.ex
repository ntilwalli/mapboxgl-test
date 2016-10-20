defmodule Listing.Worker do
  use GenServer

  def start_link(listing) do
    GenServer.start_link(__MODULE__, {:ok, listing}, [])
  end

  def init({:ok, listing}) do
    {:ok, {listing}}
  end
end