defmodule User.Auth do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  alias Shared.Message.Search.Query, as: SearchQueryMessage

  def start_link(listing_registry, user) do
    GenServer.start_link(__MODULE__, {:ok, listing_registry, user}, [])
  end

  def route(server, "/register_app_load", _) do
    :ok
  end

  def route(server, "/logout") do
    GenServer.call(server, :logout)
  end

  def route(server, "/search", query) do
    GenServer.call(server, {:search, query})
  end

  def route(server, "/retrieve_listing", listing_id) do
    GenServer.call(server, {:retrieve_listing, listing_id})
  end

  def route(server, "/check_in", message) do
    
  end

  def route(server, unknown_route, message) do 
    {:error, "Unknown route: #{unknown_route}"}
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

  def handle_call({:search, params} , _from, %{listing_registry: l_reg} = state) do
    cs = SearchQueryMessage.changeset(%SearchQueryMessage{}, params)
    case cs.valid? do
      true -> 
        query_params = apply_changes(cs)
        listings_info = User.Helpers.gather_listings_info(query_params, l_reg)
        {:reply, {:ok, listings_info}, state}
      false -> 
        {:reply, {:error, "Sent search params invalid"}, state}
    end
  end

  def handle_call({:retrieve_listing, listing_id} , _from, %{listing_registry: l_reg} = state) do
    out = case Integer.parse(listing_id) do
      {whole, _} -> 
        {:ok, pid} = Listing.Registry.lookup(l_reg, whole)
        {:ok, listing} = Listing.Worker.retrieve(pid)
        {:reply, {:ok, listing}, state}
      :error ->
        {:reply, {:error, "Sent listing id (#{listing_id}) invalid"}, state}
    end
  end

end