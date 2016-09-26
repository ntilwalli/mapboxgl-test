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

  # def handle_call({:route, %{
  #       "route" => "/listing/save", 
  #       "data" => %{
  #         "id" => id, "type" => type, "profile" => %{
  #           "meta" => %{
  #             "visibility" => visibility
  #           }} = profile
  #       } = listing
  #     }} , _from, state)  when isNumber(id) do

  #   IO.puts("Update w/o parent")
  #   {:reply, {:ok, %{type: "error", data: "blah"}}, state}  
  # end

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

    # type = Map.fetch!(listing, "type")
    # profile = Map.fetch!(listing, "profile")
    # meta = Map.fetch!(profile, "meta")
    # visibility = Map.get(Map.fetch!(profile, "meta"), "visibility")


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

    multiQuery = Ecto.Multi.new
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

    case Repo.transaction(multiQuery) do
      {:ok, %{listing: listing, user_listing: user_listing} = result} ->
        #IO.puts("Insert successful")
        #IO.inspect(result)
        {:reply, {:ok, %{type: "created", data: %{listing | user_sequence_id: user_listing.sequence_id}}}, state}
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

    
    
  #         Repo.

  #         IO.puts "Changeset:"
  #         IO.inspect changeset
  #         case Repo.insert(changeset) do
  #           {:ok, val} -> 
  #             IO.puts "insert ok"
  #             IO.inspect val
  #             {
  #               :reply, 
  #               {
  #                 :ok, %{
  #                   type: "created", 
  #                   data: val
  #                 }
  #               }, 
  #               state
  #             }
  #           {:error, val} -> 
  #             IO.puts "insert error"
  #             IO.inspect val
  #             {:reply, {:ok, %{type: "error", data: %{errors: errors_to_map(val.errors)}}}, state}
  #         end
  #       val ->
  #         IO.puts "Update existing listing"
  #         params = %{
  #           "id" => val,
  #           #"parent_id" => parent_id,
  #           "type" => type,
  #           "profile" => profile,
  #           "visibility" => visibility,
  #           #"release" => "saved"
  #           #"updated_at" => Timex.now
  #         }

  #         listing = Repo.get!(Listing, val)
  #         changeset = Listing.update_changeset(listing, params)
  #         IO.puts "Changeset:"
  #         IO.inspect changeset
  #         #{:reply, {:ok, %{type: "error", data: "Hello"}}, state}
  #         case Repo.update(changeset) do
  #           {:ok, val} -> 
  #             IO.puts "update ok"
  #             IO.inspect val
  #             {:reply, {:ok, %{type: "saved", data: val}}, state}
  #           {:error, val} -> 
  #             IO.puts "update error"
  #             IO.inspect val
  #             {:reply, {:ok, %{type: "error", data: %{errors: errors_to_map(val.errors)}}}, state}
  #         end
  #   end
  # end

  defp errors_to_map(errors) do
    Enum.into(errors, %{}, fn {k, {e, _}} -> {k, e} end)
  end

end