defmodule Listing.Worker do
  require Logger
  use GenServer
  import Ecto.Query, only: [from: 2]
  import Shared.Model.Decoders

  alias Shared.Repo
  alias Shared.Listing, as: ListingTable
  alias Shared.SingleListingSearch, as: SLSearch
  alias Shared.SingleListingCategories, as: SLCategories
  alias Shared.SingleListingEventTypes, as: SLEventTypes
  alias Shared.CheckIn


  def start_link(listing, registry_name) do
    GenServer.start_link(__MODULE__, {:ok, listing, registry_name}, [])
  end

  def delete(server, user) do
    GenServer.call(server, {:delete, user})
  end

  def update(server, listing, user) do
    GenServer.call(server, {:update, listing, user})
  end

  def add_child(server, listing, user) do
    # IO.inspect "Sending"
    # IO.inspect listing
    GenServer.call(server, {:add_child, listing, user})#, listing, user})
  end

  def retrieve(server) do
    GenServer.call(server, :retrieve)
  end

  def check_in(server, user, %Shared.Message.LngLat{} = lng_lat) do
    GenServer.call(server, {:check_in, user, lng_lat})
  end

  # def stop(server) do
  #   GenServer.stop(server, :stop)
  # end  

  def init({:ok, %Shared.Listing{id: listing_id}, r_name}) do
    Logger.metadata(listing_id: listing_id)
    case retrieve_listing_with_check_ins(listing_id) do
    #case Repo.get(Shared.Listing, listing_id) do
      nil -> {:stop, "Listing not found in database"}
      listing -> 
        Logger.info "Starting process for listing #{listing_id}"
        :ok = ensure_searchability(listing)
        ci_query = from c in Shared.CheckIn, where: c.listing_id == ^listing_id
        #IO.inspect ci_query
        check_ins = Repo.all(ci_query)
        IO.inspect check_ins
        {:ok, %{listing: listing, registry_name: r_name}, 60 * 1_000}
    end
  end

  def handle_call(:retrieve, _from, %{listing: listing} = state) do
    {:reply, {:ok, %{listing: listing}}, state}
  end

  #def handle_call({:add_child, listing, user}, _from, %{listing: listing, registry_name: r_name} = state) do
  def handle_call({:add_child, child_listing, user}, _from, %{listing: listing, registry_name: r_name} = state) do
    {:ok, result} = info = Listing.Registry.create(Listing.Registry, child_listing, user) 
    {:reply, {:ok, result}, state}
  end

  def handle_call({:update, updated_listing, user}, _, %{listing: listing, registry_name: r_name} = state) do
    u_listing = Ecto.build_assoc(user, :listings)
    u_listing = Map.put(u_listing, :id, listing.id)
    cs = ListingTable.changeset(u_listing, updated_listing)
    updated_listing = Repo.update!(cs)
    update_children(updated_listing, r_name)
    {:reply, {:ok, updated_listing}, %{state | listing: updated_listing}}
  end

  def handle_call({:delete, user}, _, %{listing: listing, registry_name: r_name}) do
    listing_id = listing.id
    query = from l in Shared.Listing,
      where: l.parent_id == ^listing_id

    results = Repo.all(query) 
    Enum.map(results, fn l -> 

      pid = Listing.Registry.lookup(r_name, l.id)
      Listing.Worker.delete(pid, user)
    end)

    Shared.Manager.ListingManager.delete_one(listing)
    {:stop, :normal, :ok, nil}
  end

  defp before_check_in_start?(event_begins, rel_start, dt) do
    false
  end

  defp after_check_in_start?(event_begins, event_ends, rel_end, dt) do
    false
  end

  def handle_call({:check_in, user, %{lng: lng, lat: lat}}, _from, %{listing: listing} = state) do
    l_type = listing.type
    case l_type do
      "single" ->
          check_ins = listing.check_ins
          settings = %{
            type: "default",
            radius: 50,
            begins: -30,
            ends: 30
          }

          default_ends = 120

          listing_lng = listing.donde.lng_lat.lng
          listing_lat = listing.donde.lng_lat.lat
          cuando = listing.cuando
          begins = cuando.begins
          ends = cuando.ends

          IO.puts "Checkin listing begins/ends"
          IO.inspect begins
          IO.inspect ends
          # Check if user already has checked-in
          cond do
            Enum.any?(check_ins, fn x -> x.user_id === user.id end) ->
              {:reply, {:error, "Already checked-in"}, state}
            before_check_in_start?(begins, settings.begins, nil) ->
              {:reply, {:error, "Check-in has not yet started"}, state}
            after_check_in_start?(begins, ends, settings.ends, nil) ->
              {:reply, {:error, "Check-ins have completed"}, state}
            Geocalc.distance_between([lat, lng], [listing_lat, listing_lng]) > settings.radius ->
              {:reply, {:error, "Not within check-in radius: #{Integer.to_string(settings.radius)} meters"}, state}
            true ->
              listing_id = listing.id
              check_in_row = Ecto.build_assoc(user, :check_ins)
                |> Map.set(:listing_id, listing_id)
                |> Map.set(:geom, %Geo.Point{coordinates: {lng, lat}, srid: 4326})
              result = Repo.insert(check_in_row)
              new_state = %{state | listing: retrieve_listing_with_check_ins(listing_id)}
              {:reply, {:ok, result}, new_state}
          end
      _ ->
        {:reply, {:error, "Invalid check-in, only allowed on single-type listings"}, state}
    end

  end

  def retrieve_listing_with_check_ins(listing_id) do
    query = from l in Shared.Listing, where: l.id == ^listing_id, preload: [:check_ins]
    Repo.one(query)
  end

  def update_children(%ListingTable{} = _listing, _registry_name) do
  end

  def ensure_searchability(listing) do
    if listing.type == "single" do
      listing_id = listing.id
      case Repo.get(Shared.SingleListingSearch, listing_id) do
        nil -> :ok
          case Repo.transaction(fn -> 
              # Logger.debug "Inserting entries for single_listing_search for listing: #{listing_id}"
              donde = decode_donde(listing.donde)
              cuando = decode_cuando(listing.type, listing.cuando)
              geom = %Geo.Point{coordinates: {donde.lng_lat.lng, donde.lng_lat.lat}, srid: 4326}
              begins = cuando.begins
              sls_row = %SLSearch{listing_id: listing_id, begins: begins, geom: geom}
              search_result = Repo.insert(sls_row)
              categories = listing.categories
              cat_results = Enum.map(categories, fn x -> 
                  cat_row = %SLCategories{category: x, listing_id: listing_id}
                  Repo.insert(cat_row)
                end)
              event_types = listing.event_types
              type_results = Enum.map(event_types, fn x -> 
                  type_row = %SLEventTypes{type: x, listing_id: listing_id}
                  Repo.insert(type_row)
                end)
            end) do
              {:ok, _} -> :ok
              val -> val
            end
        _ -> :ok
      end
    else
      :ok
    end

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
    #Logger.info "Shutting down idle process for #{state.listing.id}"
    {:stop, :normal, state}
  end

end