defmodule User.Individual do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  alias Shared.Message.Incoming.Search.Query, as: SearchQueryMessage
  alias Shared.Message.Incoming.Listing.CheckIn, as: CheckInMessage
  alias Shared.Message.Outgoing.Home.CheckIns, as: CheckInsMessage
  alias Shared.Message.DateTimeRange, as: DateTimeRangeMessage
  alias Shared.ListingSession, as: ListingSessionMessage

  def start_link(user, listing_registry) do
    GenServer.start_link(__MODULE__, {:ok, user, listing_registry})
  end

  def init({:ok, user, listing_registry}) do
    Registry.register(:individual_user_registry, user.id, user)
    Registry.register(:individual_user_registry, user.username, user)

    {:ok, %{
      user: user,
      listing_registry: listing_registry
    }}
  end


  def ensure_started(user) do
    #IO.inspect {:ensure_started, user}
    case Registry.lookup(:individual_user_registry, user.username) do
      [] -> 
        #IO.inspect {:not_started, user}
        User.IndividualsManager.start_user(User.IndividualsManager, user)
        [{pid, _}] = Registry.lookup(:individual_user_registry, user.username)
        pid
      [{pid, _}] -> 
        #IO.inspect {:already_started, user}
        pid
    end
  end

  def logout(user) do
    :ok
  end

  def retrieve_notifications(user) do
    pid = ensure_started(user)
    GenServer.call(pid, :retrieve_notifications)
  end

  def route(user, "/register_app_load") do
    :ok
  end

  def route(pid, "/home/profile") when is_pid(pid) do
    GenServer.call(pid, :home_profile)
  end

  def route(user, "/home/profile") do
    pid = ensure_started(user)
    GenServer.call(pid, :home_profile)
  end

  def route(user, "/settings") do
    pid = ensure_started(user)
    GenServer.call(pid, :settings)
  end

  def route(user, "/profile/retrieve", username) do
    pid = ensure_started(user)
    GenServer.call(pid, {:profile_retrieve, username})
  end

  def route(user, "/listing/new", listing) do
    pid = ensure_started(user)
    GenServer.call(pid, {:listing_new, listing})
  end


  def route(user, "/listing/update", listing) do
    pid = ensure_started(user)
    GenServer.call(pid, {:listing_update, listing})
  end

  def route(user, "/listing/delete", listing_id) do
    pid = ensure_started(user)
    GenServer.call(pid, {:delete_listing, listing_id})
  end

  def route(user, "/listing_session/new") do
    pid = ensure_started(user)
    GenServer.call(pid, :new_listing_session)
  end

  def route(user, "/listing_session/retrieve", id) do
    pid = ensure_started(user)
    GenServer.call(pid, {:retrieve_listing_session, id})
  end

  def route(user, "/notifications/read", notification_ids) do
    pid = ensure_started(user)
    GenServer.cast(pid, {:read_notifications, notification_ids})
  end

  def route(user, "/listing_session/save", params) do
    pid = ensure_started(user)
    GenServer.call(pid, {:save_listing_session, params})
  end

  def route(user, "/listing_session/delete", params) do
    pid = ensure_started(user)
    GenServer.call(pid, {:delete_listing_session, params})
  end

  def route(user, "/listing_session/release", params) do
    pid = ensure_started(user)
    GenServer.call(pid, {:release_listing_session, params})
  end

  def route(user, "/home/listings") do
    pid = ensure_started(user)
    GenServer.call(pid, {:home_listings})
  end

  def route(user, "/search", query) do
    pid = ensure_started(user)
    GenServer.call(pid, {:search, query})
  end

  def route(user, "/settings", settings) do
    pid = ensure_started(user)
    GenServer.call(pid, {:settings, settings})
  end

  def route(user, "/retrieve_listing", listing_id) do
    pid = ensure_started(user)
    GenServer.call(pid, {:retrieve_listing, listing_id})
  end

  def route(user, "/home/check_ins", message) do
    pid = ensure_started(user)
    GenServer.call(pid, {:home_check_ins, message})
  end

  def route(user, "/check_in", message) do
    pid = ensure_started(user)
    GenServer.call(pid, {:check_in, message})
  end

  def route(user, unknown_route, message) do 
    {:error, "Unknown route: #{unknown_route}"}
  end

  def handle_call(:home_profile, _from, %{user: user} = state) do
    {:reply, {:ok, user}, state}
  end

  def handle_call({:profile_retrieve, username}, _from, %{user: user} = state) do
    if (username === user.username) do
      {:reply, {:ok, user}, state}
    else
      case Registry.lookup(:individual_user_registry, username) do
        [{pid, _}] ->
          out = User.Individual.route(pid, "/home/profile")
          {:reply, out, state}
        [] ->
          {:reply, {:error, "User not found"}, state}
      end
    end
  end

  def handle_call(:settings, _from, %{user: user} = state) do
    result = Shared.Repo.get(Shared.Settings, user.id)
    # IO.inspect "settings"
    # IO.inspect result
    {:reply, {:ok, result}, state}
  end

  def handle_call(:new_listing_session, _from, %{user: user} = state) do
    session = Ecto.build_assoc(user, :listing_sessions)
    {:ok, result} = Shared.Repo.insert(session)
    {:reply, {:ok, result}, state}
  end

  # def handle_call({:user_retrieve, username}, _from, %{user: user} = state) do
  #   if (username === user.username) do
  #     {:reply, {:ok, username}, state}
  #   else
  #     {:reply, {:ok, Share.
  #   end
  #   result = Shared.Repo.get(Shared.ListingSession, id)
  #   {:reply, {:ok, result}, state}
  # end

  def handle_call({:retrieve_listing_session, id}, _from, %{user: user} = state) do
    result = Shared.Repo.get(Shared.ListingSession, id)
    {:reply, {:ok, result}, state}
  end

  def handle_call({:save_listing_session, %{"id" => id} = params} , _from, %{user: user, listing_registry: l_reg} = state) do
    IO.inspect {:save_listing_session, params}
    cs = Ecto.build_assoc(user, :listing_sessions, id: id)
    session_cs = ListingSessionMessage.changeset(cs, params)
    case session_cs.valid? do
      true -> 
        #session = apply_changes(session_cs)
        {:ok, session_info} = Shared.Repo.update(session_cs)
        IO.inspect {:session_save_ok, session_info}
        {:reply, {:ok, session_info}, state}
      false -> 
        IO.inspect {:session_save_error, session_cs}
        {:reply, {:error, "Sent session params invalid"}, state}
    end
  end

  def handle_call({:save_listing_session, params} , _from, %{user: user, listing_registry: l_reg} = state) do
    IO.inspect {:save_listing_session, params}
    session = Ecto.build_assoc(user, :listing_sessions)
    session_cs = ListingSessionMessage.changeset(session, params)
    case session_cs.valid? do
      true -> 
        #session = apply_changes(session_cs)
        {:ok, session_info} = Shared.Repo.insert(session_cs)
        #IO.inspect {:session_save_ok, session_info}
        {:reply, {:ok, session_info}, state}
      false -> 
        IO.inspect {:session_save_error, session_cs}
        {:reply, {:error, "Sent session params invalid"}, state}
    end
  end


  def handle_call({:delete_listing_session, id}, _from, %{user: user} = state) do
    session = Ecto.build_assoc(user, :listing_sessions, id: id)
    {:ok, result} = Shared.Repo.delete(session)
    {:reply, {:ok, result}, state}
  end

  # def handle_call({:release_listing_session, %{session: session, release_level: release_level}}, _from, %{user: user, listing_registry: l_reg} = state) do
  #   IO.inspect {:save_listing_session, params}
  #   cs = Ecto.build_assoc(user, :listing_sessions, id: id)
  #   session_cs = ListingSessionMessage.changeset(cs, params)
  #   case session_cs.valid? do
  #     true -> 
  #       session = apply_changes(session_cs)
  #       {:ok, pid} = Listing.Registry.create(l_reg, session.listing, user)
  #       result = Listing.Worker.retrieve(pid, user)
  #       {:reply, {:ok, result}, state}
  #     false -> 
  #       IO.inspect {:session_save_error, session_cs}
  #       {:reply, {:error, "Sent session params invalid"}, state}
  #   end       
  # end


  def handle_call({:search, params} , _from, %{user: user, listing_registry: l_reg} = state) do
    cs = SearchQueryMessage.changeset(%SearchQueryMessage{}, params)
    case cs.valid? do
      true -> 
        query_params = apply_changes(cs)
        listings_info = User.Helpers.gather_listings_info(query_params, user, l_reg)
        #IO.inspect {:individual_listings_info, listings_info}
        {:reply, {:ok, listings_info}, state}
      false -> 
        {:reply, {:error, "Sent search params invalid"}, state}
    end
  end

  def handle_call({:retrieve_listing, listing_id} = msg, _from, %{user: user, listing_registry: l_reg} = state) when is_integer(listing_id) do
    {:reply, retrieve_listing(listing_id, l_reg, user), state}
  end

  def handle_call({:retrieve_listing, listing_id} = msg, _from, %{user: user, listing_registry: l_reg} = state) do
    out = case Integer.parse(listing_id) do
      {whole, _} -> 
        {:reply, retrieve_listing(whole, l_reg, user), state}
      :error ->
        {:reply, {:error, "Sent listing id (#{listing_id}) invalid"}, state}
    end
  end

  def handle_call({:check_in, params}, _from, %{user: user, listing_registry: l_reg} = state) do
    cs = CheckInMessage.changeset(%CheckInMessage{}, params)
    case cs.valid? do
      true ->
        %{listing_id: listing_id, lng_lat: lng_lat} = apply_changes(cs)
        {:ok, pid} = Listing.Registry.lookup(l_reg, listing_id)
        out = Listing.Worker.check_in(pid, user, lng_lat)
        # IO.puts "Check-in output..."
        # IO.inspect out
        {:reply, out, state}
      false ->
        {:reply, {:error, "Sent invalid check-in parameters"}, state}
    end
  end

  def handle_call({:home_listings} = msg, _from, %{user: user, listing_registry: l_reg} = state) do
    listing_sessions = User.Helpers.gather_listing_sessions(user)
    staged = User.Helpers.gather_listings(user, "staged")
    posted = User.Helpers.gather_listings(user, "posted")
    out = %Home.Listings.Outgoing{
      sessions: listing_sessions,
      staged: staged,
      posted: posted
    }
    # IO.puts "Check-in output..."
    # IO.inspect out
    {:reply, {:ok, out}, state}
  end


  def handle_call({:home_check_ins, params}, _from, %{user: user} = state) do
    cs = DateTimeRangeMessage.changeset(%DateTimeRangeMessage{}, params)
    case cs.valid? do
      true ->
        out = User.Helpers.gather_check_ins(apply_changes(cs), user)
        # IO.puts "Check-in output..."
        # IO.inspect out
        {:reply, {:ok, out}, state}
      false ->
        {:reply, {:error, "Sent invalid date-time range parameters"}, state}
    end
  end

  def handle_call({:settings, params}, _from, %{user: user} = state) do
    settings_cs = Ecto.build_assoc(user, :settings)
    cs = Shared.Settings.changeset(settings_cs, params)
    case cs.valid? do
      true ->
        # IO.puts "Saved settings"
        row = apply_changes(cs)
        on_conflict = from Shared.Settings, update: [set: [use_region: ^row.use_region, default_region: ^row.default_region]]
        {:ok, result} = Shared.Repo.insert(row, on_conflict: on_conflict, conflict_target: :user_id)
        {:reply, {:ok, result}, state}
      false ->
        {:reply, {:error, "Sent invalid settings parameters"}, state}
    end
  end

  def handle_call(:retrieve_notifications, _from, %{user: user} = state) do
    {:reply, User.Notifications.retrieve(user), state}
  end

  def handle_call({:listing_new, listing}, _from, %{user: user, listing_registry: l_reg} = state) do
    out = Listing.Registry.create(l_reg, listing, user)
    out = Listing.Registry.create(l_reg, listing, user)
    {:reply, out, state}
  end

  def handle_call({:listing_update, listing}, _from, %{user: user} = state) do
    {:reply, :ok, state}
  end

  def handle_call({:listing_delete, listing_id}, _from, %{user: user} = state) do
    {:reply, :ok, state}
  end

  def handle_cast({:read_notifications, notification_ids}, %{user: user} = state) do
    User.Notifications.read(user, notification_ids)
    {:noreply, state}
  end

  defp retrieve_listing(listing_id, l_reg, user) do
    case Listing.Registry.lookup(l_reg, listing_id) do
      {:ok, pid} ->
        {:ok, result} = Listing.Worker.retrieve(pid, user)
        {:ok, result}
      {:error, message} ->
        {:error, message}
    end
  end
end