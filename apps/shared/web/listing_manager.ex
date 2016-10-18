defmodule Shared.ListingManager do
  alias Shared.Listing
  alias Shared.UserListing
  alias Shared.ChildListing
  alias Shared.Repo

  import Ecto.Query, only: [from: 2, first: 1]
  alias Ecto.Multi

  def add(%{"parent_id" => parent_id} = listing, level, user) when is_number(parent_id) do
    new_listing = Ecto.build_assoc(user, :listings)

    listing = Map.put(listing, "release",  level)
    listing_changeset = Listing.changeset(new_listing, listing)
    sequence_id = get_next_child_sequence_id(parent_id)
    multi_query = Ecto.Multi.new
      |> Multi.insert(:listing, listing_changeset)
      |> Multi.run(
        :child_listing, 
        fn changes_so_far -> 
          %{listing: result} = changes_so_far
          listing_id = result.id
          child_listing_changeset = ChildListing.insert_changeset(%ChildListing{}, %{parent_id: parent_id, listing_id: listing_id, sequence_id: sequence_id})
          Repo.insert(child_listing_changeset)
        end 
      )

    case Repo.transaction(multi_query) do
      {:ok, %{listing: listing, child_listing: _}} ->
        enriched_listing = listing 
          |> enrich_w_child_sequence_id(sequence_id)

        %{type: "created", data: enriched_listing }
      {:error, key_that_errored, %{
          listing: _, 
          child_listing: _
        } = result
      } ->
        #IO.puts("Insert not successful")
        #IO.inspect(result)
        val = Map.fetch(result, key_that_errored)
        %{type: "error", data: %{errors: errors_to_map(val.errors)}}
    end
  end

  def add(listing, level, user) do
    new_listing = Ecto.build_assoc(user, :listings)
    new_user_listing = Ecto.build_assoc(user, :user_listings)
    listing = Map.put(listing, "release",  level)
    listing_changeset = Listing.changeset(new_listing, listing)

    sequence_id = get_next_user_sequence_id(user.id)
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
      {:ok, %{listing: listing, user_listing: _}} ->
        enriched_listing = listing 
          |> enrich_w_user_sequence_id(sequence_id)

        %{type: "created", data: enriched_listing}
      {:error, key_that_errored, %{
          listing: _, 
          user_listing: _
        } = result
      } ->
        #IO.puts("Insert not successful")
        #IO.inspect(result)
        val = Map.fetch(result, key_that_errored)
        %{type: "error", data: %{errors: errors_to_map(val.errors)}}
    end
  end

  def delete(id) when is_number(id) do
    query = from l in Listing,
      where: [parent_id: ^id]

    results = Repo.all(query) 
    Enum.map(results, fn l -> delete(l.id) end)

    delete(%Listing{id: id})
  end

  def delete(%Listing{} = listing) do
    Repo.delete(listing)
  end

  defp extract_listing_type(%{"type" => type}) do 
    type
  end

  defp extract_profile(%{"profile" => profile}) do
    profile
  end

  defp extract_visibility(%{"visibility" => visibility}) do 
    visibility
  end

  defp enrich_w_child_sequence_id(listing, sequence_id) do
    %{listing | child_sequence_id: sequence_id}
  end

  defp enrich_w_user_sequence_id(listing, sequence_id) do
    %{listing | user_sequence_id: sequence_id}
  end

  defp get_next_user_sequence_id (uid) do
    query = from l in UserListing,
      where: [user_id: ^uid],
      order_by: [desc: l.sequence_id],
      select: l.sequence_id

    case query |> first |> Repo.one do
      nil -> 1
      val -> val + 1
    end
  end

  defp get_next_child_sequence_id (parent_id) do
    query = from l in ChildListing,
      where: [parent_id: ^parent_id],
      order_by: [desc: l.sequence_id],
      select: l.sequence_id

    case query |> first |> Repo.one do
      nil -> 1
      val -> val + 1
    end
  end

  defp errors_to_map(errors) do
    Enum.into(errors, %{}, fn {k, {e, _}} -> {k, e} end)
  end
end