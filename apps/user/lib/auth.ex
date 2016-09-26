defmodule User.Auth do
  use GenServer
  use Timex

  alias Shared.Listing
  alias Shared.UserListing
  alias Shared.ChildListing
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

  # def handle_call({:route, %{"route" => "/listing/save", "data" => %{"id" => id, "parentId" => parent_id} = listing}} , _from, state) do
  #   IO.puts("Update with parent")
  #   {:reply, {:ok, %{type: "error", data: "blah"}}, state}
  # end

  # def handle_call({:route, %{"route" => "/listing/save", "data" => %{"parent_id" => parent_id} = listing}} , _from, state) do
  #     IO.puts("Insert with parent")
  #     {:reply, {:ok, %{type: "error", data: "blah"}}, state}
  # end

  def handle_call({:route, %{
        "route" => "/listing/save", 
        "data" => %{
          "id" => id, "user_sequence_id" => user_sequence_id, "type" => type, "profile" => %{
            "meta" => %{
              "visibility" => visibility
            }} = profile
        } = listing
      }} , _from, state) when is_number(id) do
    %{user: user} = state
    tmp = Ecto.build_assoc(user, :listings)
    listing_w_user = Map.put(tmp, :id, id)

    listing_params = %{
      "type" => type,
      "profile" => profile,
      "visibility" => visibility,
      "release" => "saved"
    }

    listing_changeset = Listing.update_changeset(listing_w_user, listing_params)
    multi_query = Ecto.Multi.new
      |> Multi.update(:listing, listing_changeset)

    case Repo.transaction(multi_query) do
      {:ok, %{listing: listing} = result} ->
        {:reply, {:ok, %{type: "saved", data: enrich_user_sequence_id(listing, user_sequence_id)}}, state}
      {:error, key_that_errored, %Ecto.Changeset{} = result } ->
        IO.puts("Update not successful")
        IO.inspect(result)
        val = Map.fetch(result, key_that_errored)
        {:reply, {:ok, %{type: "error", data: %{errors: errors_to_map(val.errors)}}}, state}
    end
  end

  def handle_call({:route, %{
        "route" => "/listing/save", 
        "data" => %{
          "type" => type, "profile" => %{
            "meta" => %{
              "visibility" => visibility
            }} = profile
        } = listing
      }} , _from, state) do

    %{user: user} = state
    new_listing = Ecto.build_assoc(user, :listings)
    new_user_listing = Ecto.build_assoc(user, :user_listings)

    listing_params = %{
      "type" => type,
      "profile" => profile,
      "visibility" => visibility,
      "release" => "saved"
    }

    query = from l in UserListing,
      where: [user_id: ^user.id],
      order_by: [desc: l.sequence_id],
      select: l.sequence_id

    sequence_id = case query |> first |> Repo.one do
      nil -> 1
      val -> val + 1
    end

    listing_changeset = Listing.insert_changeset(new_listing, listing_params)

    multi_query = Ecto.Multi.new
      |> Multi.insert(:listing, listing_changeset)
      |> Multi.run(
        :user_listing, 
        fn changes_so_far -> 
          %{listing: result} = changes_so_far
          listing_id = result.id
          user_listing_changeset = UserListing.insert_changeset(new_user_listing, %{listing_id: listing_id, sequence_id: sequence_id})
          Repo.insert(user_listing_changeset)
        end
      )

    case Repo.transaction(multi_query) do
      {:ok, %{listing: listing, user_listing: user_listing} = result} ->
        #IO.puts("Insert successful")
        #IO.inspect(result)
        {:reply, {:ok, %{type: "created", data: enrich_user_sequence_id(listing, user_listing.sequence_id)}}, state}
      {:error, key_that_errored, %{
          listing: listing_result, 
          user_listing: user_listing_result
        } = result
      } ->
        #IO.puts("Insert not successful")
        #IO.inspect(result)
        val = Map.fetch(result, key_that_errored)
        {:reply, {:ok, %{type: "error", data: %{errors: errors_to_map(val.errors)}}}, state}
    end
  end

  defp enrich_user_sequence_id(listing, user_sequence_id) do
    %{listing | user_sequence_id: user_sequence_id}
  end

  def handle_call({:route, %{
        "route" => "/listing/post", 
        "data" => %{
          "id" => id, "user_sequence_id" => user_sequence_id, "type" => type, "profile" => %{
            "meta" => %{
              "visibility" => visibility
            }} = profile
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

    listing_changeset = Listing.update_changeset(listing_w_user, listing_params)
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
          "id" => id, "user_sequence_id" => user_sequence_id, "type" => type, "profile" => %{
            "meta" => %{
              "visibility" => visibility
            }} = profile
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

    listing_changeset = Listing.update_changeset(listing_w_user, listing_params)
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

  defp errors_to_map(errors) do
    Enum.into(errors, %{}, fn {k, {e, _}} -> {k, e} end)
  end

end