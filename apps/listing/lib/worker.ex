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


  def start_link(generator, listing, registry_name, notification_manager) do
    GenServer.start_link(__MODULE__, {:ok, listing, registry_name, notification_manager, generator}, [])
  end

  def delete(server, user) do
    GenServer.call(server, {:delete, user})
  end

  def update(server, listing, user) do
    GenServer.call(server, {:update, listing, user})
  end

  def update_internal(server, updates, user) do
    GenServer.call(server, {:update_internal, updates, user})
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

  def change_release_level(server, user, level) do
    GenServer.call(server, {:change_release_level, user, level})
  end

  def init({:ok, %Shared.Listing{id: listing_id}, r_name, n_mgr, gen_mgr}) do
    Logger.metadata(listing_id: listing_id)
    case retrieve_listing_with_other_data(listing_id) do
      nil -> {:stop, "Listing not found in database"}
      listing -> 
        IO.inspect "Starting process for listing #{listing_id}"
        #IO.inspect listing
        :ok = ensure_searchability(listing)
        {:ok, %{
          listing: listing, 
          registry_name: r_name, 
          notification_manager: n_mgr, 
          generator_manager: gen_mgr
        }, 60 * 1_000}
    end
  end

  def handle_call({:retrieve, user}, _from, %{listing: listing} = state) do
    out = get_listing_info(listing, user)
    {:reply, {:ok, out}, state}
  end

  def handle_call({:add_child_from_map, child_listing, user}, _from, %{listing: listing, registry_name: r_name} = state) do
    {:ok, result} = info = Listing.Registry.create_from_map(r_name, child_listing, user) 
    {:reply, {:ok, result}, %{state | listing: retrieve_listing_with_other_data(listing.id)}}
  end

  def handle_call({:add_child_from_struct, child_listing, user}, _from, %{listing: listing, registry_name: r_name} = state) do
    {:ok, result} = info = Listing.Registry.create(r_name, child_listing, user) 
    {:reply, {:ok, result}, %{state | listing: retrieve_listing_with_other_data(listing.id)}}
  end

  def handle_call({:update, updated_listing, user}, _, %{listing: listing, registry_name: r_name} = state) do
    IO.inspect {:updated_listing, updated_listing}
    #IO.inspect {:listing, listing}

    # u_listing = Ecto.build_assoc(user, :listings)
    # u_listing = Map.put(u_listing, :id, listing.id)
    # cs = ListingTable.changeset(u_listing, updated_listing)
    # updated_listing = Repo.update!(cs)
    updated_listing = update_self(user, updated_listing, listing)
    diff = determine_diff(updated_listing, listing)
    object = %{type: "listing", id: updated_listing.id}
    actions = classify_diff(diff, "")

    IO.inspect {:notify_actions, actions}
    
    update_children(user, updated_listing, diff, r_name)
    enriched_listing = retrieve_listing_with_other_data(listing.id)
    listing_w_info = get_listing_info(enriched_listing, user)
    {:reply, {:ok, listing_w_info}, %{state | listing: enriched_listing}}
  end

  def handle_call({:update_internal, updates, user}, _, %{listing: listing, registry_name: r_name} = state) do
    cs = ListingTable.changeset(listing, updates)
    updated_listing = Repo.update!(cs)
    diff = determine_diff(updated_listing, listing)
    object = %{type: "listing", id: updated_listing.id}
    actions = classify_diff(diff, "")
    update_children(user, updated_listing, diff, r_name)
    enriched_listing  = retrieve_listing_with_other_data(updated_listing.id)
    IO.inspect {:enriched_listing, enriched_listing.id}
    listing_w_info = get_listing_info(enriched_listing, user)
    {:reply, {:ok, listing_w_info}, %{state | listing: enriched_listing}}
  end


  def handle_call({:delete, user}, _, %{listing: listing, registry_name: r_name} = state) do
    {:ok, struct} = delete_self(user, listing, r_name)
    {:stop, :normal, :ok, nil}
  end

  def handle_call({:change_release_level, user, level} = msg, _, %{listing: listing, registry_name: r_name, generator_manager: gen_mgr} = state) do
    IO.inspect msg   
    cs = Ecto.Changeset.change(listing, release: level)
    case level do
      "canceled" -> 
        {:ok, listing} = Repo.update(cs)
        # Keep searchability for now since people may get confused when listing stops showing up...
        #   filter this on the front-end
        #remove_searchability(listing)
        change_release_level_recurrences(user, listing, level, r_name)
        {:reply, {:ok, listing}, %{state | listing: listing}}
      "posted" ->
        {:ok, listing} = Repo.update(cs)
        ensure_searchability(listing)
        Listing.GenerateRecurring.generate(gen_mgr, user, listing)
        {:reply, {:ok, listing}, %{state | listing: listing}}
      "staged" -> 
        {:ok, listing} = Repo.update(cs)
        remove_searchability(listing)
        {:reply, {:ok, listing}, %{state | listing: listing}}
      _ -> 
        {:reply, {:error, "Invalid level received #{level}"}, state}
    end
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

  defp get_listing_info(listing, user) do
    status = 
      case user do
        nil -> nil
        _ -> %{checked_in: listing.check_ins |> Enum.any?(fn x -> x.user_id === user.id end)}
      end

    %{
      listing: listing, 
      children: listing.children, 
      status: status
    }
  end

  def delete_self(user, listing, r_name) do
    listing_id = listing.id
    query = from l in Shared.Listing,
      where: l.parent_id == ^listing_id

    results = Repo.all(query) 

    Enum.each(results, fn l -> 
      {:ok, pid} = Listing.Registry.lookup(r_name, l.id)
      Listing.Worker.delete(pid, user)
    end)

    Shared.Manager.ListingManager.delete_one(listing)
  end

  defp determine_diff(updated, current) do
    current_json = Poison.encode!(current)
    current_map = Poison.decode!(current_json)
    updated_json = Poison.encode!(updated)
    updated_map = Poison.decode!(updated_json)

    IO.inspect {:diff_current_json, current_map}
    IO.inspect {:diff_updated_json, updated_map}
    diff = JsonDiffEx.diff(current_map, updated_map)
    IO.inspect {:update_diff, diff}
    diff
  end

  defp update_self(user, %{} = updated_listing, current_listing) do
    u_listing = Ecto.build_assoc(user, :listings)
    u_listing = Map.put(u_listing, :id, current_listing.id)
    cs = ListingTable.changeset(u_listing, updated_listing)
    updated_listing = Repo.update!(cs)
    updated_listing
  end

  defp update_children(user, %ListingTable{} = listing, diff, r_name) do
    listing_id = listing.id
    query = from l in Shared.Listing,
      where: l.parent_id == ^listing_id

    results = Repo.all(query) 

    Enum.each(results, fn l -> 
      {:ok, pid} = Listing.Registry.lookup(r_name, l.id)

      updates = %{
        meta: listing.meta,
        donde: listing.donde,
        settings: listing.settings
      }

      Listing.Worker.update_internal(pid, updates, user)
    end)
  end

  defp classify_diff(diff, base) do
    IO.inspect {:base, base}
    diff |> Map.keys() |> Enum.flat_map(fn key -> 
      item = diff[key]
      address = "#{base}/#{key}"
      case item do
        [added] -> [%{type: "add_property", address: address, data: added}]
        [from, to] -> [%{type: "update_property", address: address, data: %{from: from, to: to}}]
        [deleted, 0, 0] -> [%{type: "delete_property", address: address}]
        %{"_t" => "a"} -> classify_array_diff(item, base <> "/" <> key)
        %{} -> classify_diff(item, base <> "/" <> key)
        _ -> %{type: "unhandled", address: address}
      end
    end)
  end

  defp classify_array_diff(diff, base) do
    address = "#{base}"
    # diff |> Map.keys() |> Enum.flat_map(fn key -> 
    #   case item do
    #     "_" <> index -> [%{type: abs_type <> "mod" <> address, data: added}]
    #     index -> [%{type: abs_type <> "update_property" <> address, data: %{from: from, to: to}}]
    #     _ -> %{type: abs_type <> "unhandled" <> address}
    #   end
    # end)

    [%{type: "modify_array", address: address, data: diff}]
  end

  defp generate_notify_actions(diff) do
    # Cuando
    # Donde
    # Meta
    ## Name
    ## Description
    ## Short Description
    ## Event types
    ## Categories
    ## Performer sign-up
    ## Performer check-in
    ## Performer cost (array)
    ## Performer stage-time (array)
    ## Performer limit
    ## Notes
    ## Contact info
    ## Audience cost
    ## Participant sign-up
    ## Participant limit
    ## Participant cost
    ## Listed hosts (array)
    ## Listed performers (array)

    diff |> Map.keys() |> Enum.flat_map(fn key -> 

      case key do
        "cuando" ->
          IO.inspect {"got_cuando"}
          cuando_diff = diff["cuando"]
          cuando_actions = cuando_diff |> Map.keys() |> Enum.map(fn key ->
            get_cuando_diff(key, cuando_diff)
          end)
          Enum.filter(cuando_actions, fn x -> x end)
        "meta" ->
          meta_diff = diff["meta"]
          meta_actions = meta_diff |> Map.keys() |> Enum.map(fn key ->
            get_meta_diff(key, meta_diff)
          end)
          meta_actions
        _ -> 
          IO.inspect {"got_" <> key}
          [get_simple_diff(key, diff, "")]
      end
    end)
  end

  defp get_simple_diff(key, diff, base) do
    item = diff[key]
    address = "/" <> base <> "/" <> key
    IO.inspect {:item, item}
    case item do
      [added] ->%{type: "/listing/add_property" <> address, data: added}
      [from, to] -> %{type: "/listing/update_property" <> address, data: %{from: from, to: to}}
      [deleted, 0, 0] -> %{type: "/listing/delete_property" <> address}
      %{"_t" => "a"} -> %{type: "/listing/add_property_items" <> address}
      _ -> %{type: "/listing/unhandled" <> address}
    end
  end

  defp get_meta_diff(key, diff) do
    item = diff[key]
    address = "/" <> "meta" <> "/" <> key
    IO.inspect {:item, item}
    case key do
      [added] ->%{type: "/listing/add_property" <> address, data: added}
      [from, to] -> %{type: "/listing/update_property" <> address, data: %{from: from, to: to}}
      [deleted, 0, 0] -> %{type: "/listing/delete_property" <> address}
      %{"_t" => "a"} -> %{type: "/listing/add_property_items" <> address}
      _ -> %{type: "/listing/unhandled" <> address}
    end
  end

  defp get_cuando_diff(key, diff) do
    item = diff[key]
    address = "/cuando/" <> key
    case item do
      [added] ->%{type: "/listing/add_property" <> address, address: address, data: added}
      [from, to] -> 
        {:ok, from_dt} = Calendar.DateTime.Parse.rfc3339_utc(from)
        {:ok, to_dt} = Calendar.DateTime.Parse.rfc3339_utc(to)
        case Calendar.DateTime.diff(from_dt, to_dt) do
          {:ok, 0, 0, :same_time} -> nil
          _ -> %{type: "/listing/update_property" <> address, data: %{from: from, to: to}}
        end
      [deleted, 0, 0] -> %{type: "/listing/delete_property"}
      %{"_t" => "a"} -> %{type: "/listing/add_property_items" <> address}
      _ -> %{type: "unhandled_diff_type_" <> key}
    end
  end

  defp diff_name(diff) do
    case diff["name"] do
      nil ->
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

  defp change_release_level_recurrences(user, listing, level, r_name) do
    if listing.type === "recurring" do
      query = from l in Shared.Listing,
        where: l.parent_id == ^listing.id and
          fragment("(?->>'begins')::timestamptz > now()", l.cuando)
      
      results = Repo.all(query)

      Enum.map(results, fn l -> 
        {:ok, pid} = Listing.Registry.lookup(r_name, l.id)
        Listing.Worker.change_release_level(pid, user, level)
      end)
    end
  end

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


  def ensure_searchability(listing) do
    if listing.type === "single"  && listing.visibility === "public" do
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

  def remove_searchability(listing) do
      listing_id = listing.id
      case Repo.get(Shared.SingleListingSearch, listing_id) do
        nil -> :ok
        _ -> 
          case Repo.transaction(fn -> 
              from(p in SLSearch, where: p.listing_id == ^listing_id) |> Repo.delete_all
              from(p in SLCategories, where: p.listing_id == ^listing_id) |> Repo.delete_all
              from(p in SLEventTypes, where: p.listing_id == ^listing_id) |> Repo.delete_all
            end) do
              {:ok, _} -> :ok
              val -> val
          end
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