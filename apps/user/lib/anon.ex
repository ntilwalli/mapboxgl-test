defmodule User.Anon do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  alias Shared.Message.Incoming.Search.Query, as: SearchQueryMessage
  alias Shared.Message.Listing.CheckIn, as: CheckInMessage
  
  def start_link(individuals_manager, listing_registry, anonymous_id) do
    name = via_tuple(anonymous_id)
    GenServer.start_link(__MODULE__, {:ok, anonymous_id, individuals_manager, listing_registry}, name: name)
    #Registry.lookup(:anonymous_user_registry, anonymous_id)
  end


  def ensure_started(anonymous_id) do
    name = via_tuple(anonymous_id)
    case Registry.lookup(:anonymous_user_registry, anonymous_id) do
      [] -> 
        User.AnonManager.start_user(User.AnonManager, anonymous_id)
        name
      [head | tail] -> 
        name
    end
  end

  defp via_tuple(anonymous_id) do
    {:via, Registry, {:anonymous_user_registry, anonymous_id}}
  end


  def login(anonymous_id, message) do
    name = ensure_started(anonymous_id)
    GenServer.call(name, {:login, message})
  end

  def oauth_login(anonymous_id, message) do
    name = ensure_started(anonymous_id)
    GenServer.call(name, {:oauth_login, message})
  end

  def oauth_signup(anonymous_id, message) do
    name = ensure_started(anonymous_id)
    GenServer.call(name, {:oauth_signup, message})
  end

  def signup(anonymous_id, message) do
    name = ensure_started(anonymous_id)
    GenServer.call(name, {:signup, message})
  end

  def route(anonymous_id, "/register_app_load") do
    :ok
  end

  def route(anonymous_id, "/search", query) do
    name = ensure_started(anonymous_id)
    GenServer.call(name, {:search, query})
  end

  def route(anonymous_id, "/retrieve_listing", listing_id) do
    name = ensure_started(anonymous_id)
    GenServer.call(name, {:retrieve_listing, listing_id})
  end

  def route(user, "/listing/query", query) do
    pid = ensure_started(user)
    GenServer.call(pid, {:listing_query, query})
  end

  def route(user, "/listing/info_query", query) do
    pid = ensure_started(user)
    GenServer.call(pid, {:listing_info_query, query})
  end

  def route(user, "/profile/retrieve", username) do
    IO.inspect {:profile_retrieve_client, username}
    pid = ensure_started(user)
    GenServer.call(pid, {:profile_retrieve, username})
  end

  def route(anonymous_id, unknown_route, message) do 
    IO.inspect {:anon_unknown_route, unknown_route, message}
    {:error, "Unknown route: #{unknown_route}"}
  end

  def init({:ok, anonymous_id, individuals_manager, listing_registry}) do
    {:ok, %{
      individuals_manager: individuals_manager,
      listing_registry: listing_registry, 
      anonymous_id: anonymous_id
    }}
  end

  def handle_call({:login, info}, _from, state) do
    out = Auth.Manager.login(Auth.Manager, info)
    {:reply, out, state}
  end

  def handle_call({:oauth_login, info}, _from, state) do
    out = Auth.Manager.oauth_login(Auth.Manager, info)
    {:reply, out, state}
  end

  def handle_call({:signup, info}, _from, state) do
    out = Auth.Manager.signup(Auth.Manager, info)
    case out do
      {:ok, user} -> 
        User.IndividualsManager.start_user(state.individuals_manager, user)
        {:stop, :normal, out, nil}
      _ -> 
        {:reply, out, state}
    end
  end

  def handle_call({:oauth_signup, info}, _from, state) do
    out = Auth.Manager.oauth_signup(Auth.Manager, info)
    case out do
      {:ok, user} -> 
        #IO.puts "Handling oauth signup"
        User.IndividualsManager.start_user(state.individuals_manager, user)
        {:reply, out, state}
      _ -> 
        {:reply, out, state}
    end
  end

  def handle_call({:search, params} , _from, %{listing_registry: l_reg} = state) do
    cs = SearchQueryMessage.changeset(%SearchQueryMessage{}, params)
    case cs.valid? do
      true -> 
        query_params = apply_changes(cs)
        listings_info = User.Helpers.gather_listings_info(query_params, nil, l_reg)
        #IO.inspect {:anon_listings_info, listings_info}
        {:reply, {:ok, listings_info}, state}
      false -> 
        {:reply, {:error, "Sent search params invalid"}, state}
    end
  end

  def handle_call({:listing_query, params}, _from, state) do
    cs = Listing.Query.changeset(%Listing.Query{}, params)
    case cs.valid? do
      true ->
        # IO.puts "Saved settings"
        query = apply_changes(cs)
        result = User.Helpers.listing_query(nil, query)
        {:reply, {:ok, result}, state}
      false ->
        {:reply, {:error, "Sent invalid listing query parameters"}, state}
    end
  end

  def handle_call({:listing_info_query, params}, _from, %{listing_registry: l_reg} = state) do
    cs = Listing.Query.changeset(%Listing.Query{}, params)
    case cs.valid? do
      true ->
        # IO.puts "Saved settings"
        query = apply_changes(cs)
        results = User.Helpers.listing_query(nil, query)
        info_results = User.Helpers.get_listings_info_from_results(results, nil, l_reg)
        {:reply, {:ok, info_results}, state}
      false ->
        {:reply, {:error, "Sent invalid listing info query parameters"}, state}
    end
  end

  def handle_call({:retrieve_listing, listing_id} = msg, _from, %{listing_registry: l_reg} = state) when is_integer(listing_id) do
    {:reply, retrieve_listing(listing_id, l_reg), state}
  end

  def handle_call({:retrieve_listing, listing_id} , _from, %{listing_registry: l_reg} = state) do
    out = case Integer.parse(listing_id) do
      {whole, _} -> 
        {:reply, retrieve_listing(whole, l_reg), state}
      :error ->
        {:reply, {:error, "Sent listing id (#{listing_id}) invalid"}, state}
    end
  end

  def handle_call({:profile_retrieve, username}, _from, state) do
    #IO.inspect {:profile_retrieve, username}
    case Shared.Repo.one(from u in Shared.User, where: u.username == ^username, select: u) do
      nil ->
        #IO.inspect {:user_not_found, username}
        {:reply, {:error, "User not found"}, state}
      user ->
        #IO.inspect {:found_pid, username, user}
        out = User.Individual.route(user, "/home/profile")
        {:reply, out, state}
    end
  end


  defp retrieve_listing(listing_id, l_reg) do
    case Listing.Registry.lookup(l_reg, listing_id) do
      {:ok, pid} ->
        {:ok, result} = Listing.Worker.retrieve(pid, nil)
        {:ok, result}
      {:error, message} ->
        {:error, message}
    end
  end

end