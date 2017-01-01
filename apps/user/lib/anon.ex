defmodule User.Anon do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  alias Shared.Message.Incoming.Search.Query, as: SearchQueryMessage
  alias Shared.Message.Listing.CheckIn, as: CheckInMessage
  
  def start_link(listing_registry, anonymous_id) do
    GenServer.start_link(__MODULE__, {:ok, listing_registry, anonymous_id}, [])
  end

  def login(server, message) do
    GenServer.call(server, {:login, message})
  end

  def oauth_login(server, message) do
    GenServer.call(server, {:oauth_login, message})
  end

  def oauth_signup(server, message) do
    GenServer.call(server, {:oauth_signup, message})
  end

  def signup(server, message) do
    GenServer.call(server, {:signup, message})
  end

  def route(server, "/register_app_load") do
    :ok
  end

  def route(server, "/search", query) do
    GenServer.call(server, {:search, query})
  end

  def route(server, "/retrieve_listing", listing_id) do
    GenServer.call(server, {:retrieve_listing, listing_id})
  end

  def route(server, unknown_route, message) do 
    {:error, "Unknown route: #{unknown_route}"}
  end

  def init({:ok, listing_registry, anonymous_id}) do
    {:ok, %{anonymous_id: anonymous_id, listing_registry: listing_registry}}
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
        User.Registry.create_auth_process(User.Registry, user)
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
        User.Registry.create_auth_process(User.Registry, user)
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