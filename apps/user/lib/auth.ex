defmodule User.Auth do
  use GenServer
  use Timex

  alias Shared.ListingSessionManager
  alias Shared.ListingSession
  alias Shared.Repo
  
  import Ecto.Query, only: [from: 2, first: 1]
  alias Ecto.Multi

  def start_link(user) do
    GenServer.start_link(__MODULE__, {:ok, user}, [])
  end

  def logout(server) do
    GenServer.call(server, :logout)
  end

  def search(server, query) do
    GenServer.call(server, {:search, query})
  end

  def init({:ok, user}) do
    {:ok, %{
      user: user
    }}
  end

  def handle_call(:logout, _, state) do
    {:stop, :normal, :ok, nil}
  end

  def handle_call({:search, query} , _from, state) do
    {:reply, {:ok, []}, state}
  end



end