defmodule User.Anon do
  use GenServer

  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Shared.Macro.GeoGeography
  alias Shared.Repo
  alias Shared.Message.Search.Query, as: SearchQuery
  
  def start_link(listing_registry, anonymous_id) do
    GenServer.start_link(__MODULE__, {:ok, listing_registry, anonymous_id}, [])
  end

  def route(server, message) do
    GenServer.call(server, message)
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

  def search(server, query) do
    GenServer.call(server, {:search, query})
  end

  def retrieve_listing(server, listing_id) do
    GenServer.call(server, {:retrieve_listing, listing_id})
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
        IO.puts "Handling oauth signup"
        User.Registry.create_auth_process(User.Registry, user)
        {:reply, out, state}
      _ -> 
        {:reply, out, state}
    end
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