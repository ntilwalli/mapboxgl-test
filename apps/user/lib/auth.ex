defmodule User.Auth do
  use GenServer
  use Timex

  alias Shared.ListingSessionManager
  alias Shared.ListingSession
  alias Shared.Repo
  
  import Ecto.Query, only: [from: 2, first: 1]
  alias Ecto.Multi

  def start_link(args, opts \\ []) do
    # IO.puts "Printing"
    # IO.inspect args
    GenServer.start_link(__MODULE__, args, [])
  end

  def route(server, message) do
    GenServer.call(server, {:route, message})
  end

  def init([{:user, user}] = args) do
    {:ok, %{
      user: user
    }}
  end

  # def handle_call({:route, %{
  #       "route" => "/listing_session/save", 
  #       "data" => %{"id" => id} = session
  #     }} , _from, state) when is_number(id) do

  #   %{user: user} = state
  #   tmp = Ecto.build_assoc(user, :listing_sessions)
  #   session_w_user = Map.put(tmp, :id, id)

  #   session_params = %{
  #     "listing" => session["listing"],
  #     "search_area" => session["search_area"]
  #   }

  #   session_changeset = ListingSession.changeset(session_w_user, session_params)
  #   multi_query = Ecto.Multi.new
  #     |> Multi.update(:session, session_changeset)

  #   case Repo.transaction(multi_query) do
  #     {:ok, %{session: session}} ->
  #       {:reply, {:ok, %{type: "saved", data: session}}, state}
  #     {:error, key_that_errored, %Ecto.Changeset{} = result } ->
  #       IO.puts("Update not successful")
  #       IO.inspect(result)
  #       val = Map.fetch(result, key_that_errored)
  #       {:reply, {:ok, %{type: "error", data: %{errors: errors_to_map(val.errors)}}}, state}
  #   end
  # end

  def handle_call({:route, %{
        "route" => "/listing_session/save", 
        "data" => session
      }} , _from, state) do

    %{user: user} = state
    {:reply, {:ok, ListingSessionManager.add(session, user)}, state}
  end


  def handle_call({:route, %{
        "route" => "/listing/post", 
        "data" => %{
          "id" => id, 
          "user_sequence_id" => user_sequence_id, 
          "type" => type, 
          "visibility" => visibility,
          "profile" => profile
        } = listing
      }} , _from, state) when is_number(id) do
    %{user: user} = state
    tmp = Ecto.build_assoc(user, :listings)
    listing_w_user = Map.put(tmp, :id, id)

    listing_params = %{
      "type" => type,
      "profile" => profile,
      "visibility" => visibility,
      "release" => "posted"
    }

    listing_changeset = Listing.changeset(listing_w_user, listing_params)
    multi_query = Ecto.Multi.new
      |> Multi.update(:listing, listing_changeset)

    case Repo.transaction(multi_query) do
      {:ok, %{listing: listing} = result} ->
        {:reply, {:ok, %{type: "success", data: enrich_user_sequence_id(listing, user_sequence_id)}}, state}
      {:error, key_that_errored, %Ecto.Changeset{} = result } ->
        IO.puts("Posting not successful")
        IO.inspect(result)
        val = Map.fetch(result, key_that_errored)
        {:reply, {:ok, %{type: "error", data: %{errors: errors_to_map(val.errors)}}}, state}
    end
  end

  def handle_call({:route, %{
        "route" => "/listing/stage", 
        "data" => %{
          "id" => id, 
          "user_sequence_id" => user_sequence_id, 
          "type" => type, 
          "visibility" => visibility,
          "profile" => profile
        } = listing
      }} , _from, state) when is_number(id) do
    %{user: user} = state
    tmp = Ecto.build_assoc(user, :listings)
    listing_w_user = Map.put(tmp, :id, id)

    listing_params = %{
      "type" => type,
      "profile" => profile,
      "visibility" => visibility,
      "release" => "staged"
    }

    listing_changeset = Listing.changeset(listing_w_user, listing_params)
    multi_query = Ecto.Multi.new
      |> Multi.update(:listing, listing_changeset)

    case Repo.transaction(multi_query) do
      {:ok, %{listing: listing} = result} ->
        {:reply, {:ok, %{type: "success", data: enrich_user_sequence_id(listing, user_sequence_id)}}, state}
      {:error, key_that_errored, %Ecto.Changeset{} = result } ->
        IO.puts("Staging not successful")
        IO.inspect(result)
        val = Map.fetch(result, key_that_errored)
        {:reply, {:ok, %{type: "error", data: %{errors: errors_to_map(val.errors)}}}, state}
    end
  end

  defp enrich_user_sequence_id(listing, user_sequence_id) do
    %{listing | user_sequence_id: user_sequence_id}
  end

  defp errors_to_map(errors) do
    Enum.into(errors, %{}, fn {k, {e, _}} -> {k, e} end)
  end

end