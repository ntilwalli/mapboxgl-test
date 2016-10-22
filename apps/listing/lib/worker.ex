defmodule Listing.Worker do
  require Logger
  use GenServer
  import Ecto.Query, only: [from: 2]

  alias Shared.Listing, as: ListingTable

  def start_link(listing, registry_name) do
    GenServer.start_link(__MODULE__, {:ok, listing, registry_name}, [])
  end

  def delete(server, user) do
    GenServer.call(server, {:delete, user})
  end

  def update(server, listing, user) do
    #IO.inspect listing
    #IO.inspect user
    GenServer.call(server, {:update, listing, user})
  end

  # def stop(server) do
  #   GenServer.stop(server, :stop)
  # end  

  def init({:ok, %Shared.Listing{id: listing_id}, r_name}) do
    case Shared.Repo.get(Shared.Listing, listing_id) do
      nil -> {:stop, "Listing not found in database"}
      listing -> 
        Logger.debug "Starting process for listing #{listing_id}"
        {:ok, %{listing: listing, registry_name: r_name}, 60 * 1_000}
    end
  end

  def handle_call({:update, updated_listing, user}, _, %{listing: listing, registry_name: r_name} = state) do
    u_listing = Ecto.build_assoc(user, :listings)
    u_listing = Map.put(u_listing, :id, listing.id)
    cs = ListingTable.changeset(u_listing, updated_listing)
    updated_listing = Shared.Repo.update!(cs)
    update_children(updated_listing, r_name)
    {:reply, {:ok, updated_listing}, %{state | listing: updated_listing}}
  end

  def handle_call({:delete, user}, _, %{listing: listing, registry_name: r_name}) do
    listing_id = listing.id
    query = from l in Shared.Listing,
      where: l.parent_id == ^listing_id

    results = Shared.Repo.all(query) 
    Enum.map(results, fn l -> 

      pid = Listing.Registry.lookup(r_name, l.id)
      Listing.Worker.delete(pid, user)
    end)

    Shared.Manager.ListingManager.delete_one(listing)
    {:stop, :normal, :ok, nil}
  end

  defp update_children(%ListingTable{} = _listing, _registry_name) do
  end

  #defp update_children(_) do end

  # def handle_call(:stop, _, %{listing: listing}) do
  #   query = from l in Listing,
  #     where: l.parent_id == ^listing.id
  #   results = Repo.all(query) 
  #   Enum.map(results, fn l -> 
  #     pid = Listing.Registry.lookup(l.id)
  #     Listing.Worker.stop(pid)
  #   end)

  #   {:stop, :normal, :ok, nil}
  # end

  # def handle_call(:stop, _, %{listing: listing) do
  #   stop(listing)
  # end

  def handle_info(:timeout, state) do
    Logger.info "Shutting down idle process for #{state.listing.id}"
    {:stop, :normal, state}
  end

end