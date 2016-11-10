defmodule User.Auth do
  use GenServer

  alias Shared.ListingSessionManager
  alias Shared.ListingSession
  alias Shared.Repo
  
  import Ecto.Query, only: [from: 2, first: 1]
  alias Ecto.Multi
  alias Shared.Message.Search.Query, as: SearchQuery

  def start_link(listing_registry, user) do
    GenServer.start_link(__MODULE__, {:ok, listing_registry, user}, [])
  end

  def logout(server) do
    GenServer.call(server, :logout)
  end

  def search(server, query) do
    GenServer.call(server, {:search, query})
  end

  def retrieve_listing(server, listing_id) do
    GenServer.call(server, {:retrieve_listing, listing_id})
  end

  def init({:ok, listing_registry, user}) do
    {:ok, %{
      user: user,
      listing_registry: listing_registry
    }}
  end

  def handle_call(:logout, _, state) do
    {:stop, :normal, :ok, nil}
  end

  def handle_call({:search, %SearchQuery{} = query} , _from, state) do
    listings = User.Helpers.search(query)
    {:reply, {:ok, listings}, state}
  end

  def handle_call({:retrieve_listing, id} , _from, %{listing_registry: listing_registry} = state) do
    {:ok, pid} = Listing.Registry.lookup(listing_registry, id)
    {:ok, listing} = Listing.Worker.retrieve(pid)
    {:reply, {:ok, listing}, state}
  end

end