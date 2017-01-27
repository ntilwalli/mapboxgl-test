defmodule Listing.Worker do
  require Logger
  use GenServer
  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  import Shared.Model.Decoders

  alias Shared.Repo
  alias Shared.Listing, as: ListingTable
  alias Shared.SingleListingSearch, as: SLSearch
  alias Shared.SingleListingCategories, as: SLCategories
  alias Shared.SingleListingEventTypes, as: SLEventTypes
  alias Shared.CheckIn

  alias Shared.Model.Listing.Meta.Badslava, as: BadslavaMeta
  alias Shared.Model.Listing.Settings.Badslava, as: BadslavaSettings
  alias Shared.Model.Once, as: CuandoOnce


  def start_link(listing, registry_name) do
    GenServer.start_link(__MODULE__, {:ok, listing, registry_name}, [])
  end

  def delete(server, user) do
    GenServer.call(server, {:delete, user})
  end

  def update(server, listing, user) do
    GenServer.call(server, {:update, listing, user})
  end

  def add_child_from_map(server, listing, user) do
    GenServer.call(server, {:add_child_from_map, listing, user})#, listing, user})
  end

  def add_child_from_struct(server, listing, user) do
    GenServer.call(server, {:add_child_from_struct, listing, user})#, listing, user})
  end


  def retrieve(server, user) do
    GenServer.call(server, {:retrieve, user})
  end

  def check_in(server, user, %Shared.Message.LngLat{} = lng_lat) do
    GenServer.call(server, {:check_in, user, lng_lat})
  end

  def init({:ok, %Shared.Listing{id: listing_id}, r_name}) do
    Logger.metadata(listing_id: listing_id)
    case retrieve_listing_with_other_data(listing_id) do
      nil -> {:stop, "Listing not found in database"}
      listing -> 
        IO.inspect "Starting process for listing #{listing_id}"
        #IO.inspect listing
        :ok = ensure_searchability(listing)
        {:ok, %{listing: listing, registry_name: r_name}, 60 * 1_000}
    end
  end

  def handle_call({:retrieve, user}, _from, %{listing: listing} = state) do
    status = 
      case user do
        nil -> nil
        _ -> %{checked_in: listing.check_ins |> Enum.any?(fn x -> x.user_id === user.id end)}
      end

    #IO.puts "Retrieve listing..."
    #IO.inspect  %{listing: listing, children: listing.children, status: status}
    {:reply, {:ok, %{listing: listing, children: listing.children, status: status}}, state}
  end

  def handle_call({:add_child_from_map, child_listing, user}, _from, %{listing: listing, registry_name: r_name} = state) do
    {:ok, result} = info = Listing.Registry.create_from_map(r_name, child_listing, user) 
    {:reply, {:ok, result}, state}
  end

  def handle_call({:add_child_from_struct, child_listing, user}, _from, %{listing: listing, registry_name: r_name} = state) do
    {:ok, result} = info = Listing.Registry.create(r_name, child_listing, user) 
    {:reply, {:ok, result}, state}
  end

  def handle_call({:update, updated_listing, user}, _, %{listing: listing, registry_name: r_name} = state) do
    IO.inspect {:updated_listing, updated_listing}
    IO.inspect {:listing, listing}

    u_listing = Ecto.build_assoc(user, :listings)
    u_listing = Map.put(u_listing, :id, listing.id)
    cs = ListingTable.changeset(u_listing, updated_listing)
    updated_listing = Repo.update!(cs)
    update_children(updated_listing, r_name)
    {:reply, {:ok, updated_listing}, %{state | listing: updated_listing}}
  end

  def handle_call({:delete, user}, _, %{listing: listing, registry_name: r_name}) do
    IO.inspect {:delete_listing, listing}
    listing_id = listing.id
    query = from l in Shared.Listing,
      where: l.parent_id == ^listing_id

    results = Repo.all(query) 

    Enum.map(results, fn l -> 
      pid = Listing.Registry.lookup(r_name, l.id)
      Listing.Worker.delete(pid, user)
    end)

    Shared.Manager.ListingManager.delete_one(listing)
    IO.inspect {:attempting_delete, listing}
    {:stop, :normal, :ok, nil}
  end

  def handle_call({:check_in, user, %{lng: lng, lat: lat} = lng_lat}, _from, %{listing: listing} = state) do
    case get_check_in_ability(user, lng_lat, listing) do
      {:error, val} = response -> {:reply, response, state}
      :ok ->
        listing_id = listing.id
        check_in_row = Ecto.build_assoc(user, :check_ins)
          |> Map.put(:listing_id, listing_id)
          |> Map.put(:geom, %Geo.Point{coordinates: {lng, lat}, srid: 4326})
          |> Map.put(:inserted_at, Calendar.DateTime.now_utc())
        {:ok, result} = Repo.insert(check_in_row)
        new_state = %{state | listing: retrieve_listing_with_other_data(listing_id)}
        {:reply, {:ok, result}, new_state}
    end
  end

  # def handle_call({:remove_check_in, user}, _from, %{listing: listing} = state) do
  #   listing_id = listing.id
  #   check_in_row = Ecto.build_assoc(user, :check_ins)
  #     |> Map.put(:listing_id, listing_id)
  #   {:ok, result} = Repo.delete(check_in_row)
  #   new_state = %{state | listing: retrieve_listing_with_other_data(listing_id)}
  #   {:reply, {:ok, result}, new_state}
  # end

  defp get_check_in_ability(user, %{lng: lng, lat: lat} = lng_lat, listing) do
    l_type = listing.type
    case l_type do
      "single" ->
          cs_donde = Donde.Badslava.changeset(%Donde.Badslava{}, listing.donde)
          donde = apply_changes(cs_donde)
          #IO.inspect donde
          cs_cuando = CuandoOnce.changeset(%CuandoOnce{}, listing.cuando)
          cuando = apply_changes(cs_cuando)
          #IO.inspect cuando
          cs_meta = BadslavaMeta.changeset(%BadslavaMeta{}, listing.meta)
          meta = apply_changes(cs_meta)
          #IO.inspect meta
          cs_settings = BadslavaSettings.changeset(%BadslavaSettings{}, listing.settings)
          settings = apply_changes(cs_settings)
          #IO.inspect cs_settings

          case not is_nil(settings.check_in) do
            true -> 
              check_ins = listing.check_ins
              checkin_begins =
                case settings.check_in.begins do
                  nil -> 
                    {:ok, out} = Calendar.DateTime.add(cuando.begins, 30 * 60)
                    out
                  val -> 
                    {:ok, out} = Calendar.DateTime.add(cuando.begins, val * 60)
                    out
                end
              checkin_ends =
                case cuando.ends do
                  nil -> 
                    case settings.check_in.ends do
                      nil -> 
                        {:ok, out} = Calendar.DateTime.add(cuando.begins, 120 * 60)
                        out
                      val -> 
                        {:ok, out} = Calendar.DateTime.add(cuando.begins, val * 60)
                        out
                    end
                  val -> cuando.ends
                end

              now = Calendar.DateTime.now_utc()
              within_window = Calendar.DateTime.after?(now, checkin_begins) and Calendar.DateTime.before?(now, checkin_ends)
              # IO.inspect now
              # IO.inspect checkin_begins
              # IO.inspect checkin_ends
              # IO.puts "Within time window"
              # IO.inspect within_window

              user_ll = %{lat: lat, lon: lng}
              venue_ll = %{lat: donde.lng_lat.lat, lon: donde.lng_lat.lng}
              distance = Geocalc.distance_between(user_ll, venue_ll)
              # IO.puts "distance"
              # IO.inspect distance

              checkin_radius =
                case settings.check_in.radius do
                  nil -> 30
                  val -> val
                end

              within_radius = distance <= checkin_radius
              # IO.puts "Within radius"
              # IO.inspect within_radius
              cond do
                Enum.any?(check_ins, fn x -> x.user_id === user.id end) ->
                  {:error, "Already checked-in"}
                # !within_window ->
                #   {:error, "Check-in time window has passed"}
                # !within_radius ->
                #   {:error, "Not within check-in radius: #{Integer.to_string(settings.check_in.radius)} meters"}
                true ->
                  :ok
              end
            false ->
              {:error, "Check-in not enabled for this listing"}
          end
      _ ->
        {:error, "Invalid check-in, only allowed on single-type listings"}
    end
  end

  def retrieve_listing_with_other_data(listing_id) do
    query = from l in Shared.Listing, where: l.id == ^listing_id, preload: [:check_ins, :children, :parent, :group_child_listings, :user_child_listing, :user]
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

              categories = listing.meta["categories"]
              cat_results = Enum.map(categories, fn x -> 
                  cat_row = %SLCategories{category: x, listing_id: listing_id}
                  Repo.insert(cat_row)
                end)
              event_types = listing.meta["event_types"]
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