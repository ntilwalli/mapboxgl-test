defmodule Shared.Manager.ListingManager do
  alias Shared.Listing
  alias Shared.UserListing
  alias Shared.ChildListing
  alias Shared.Repo

  import Ecto.Query, only: [from: 2, first: 1]
  alias Ecto.Multi

  def add(%{ "parent_id" => parent_id } = listing, user) when is_number(parent_id) do
    case Repo.get(Shared.Listing, parent_id) do
      nil -> {:error, {listing, "invalid parent id"}}
      _ -> add_listing(listing, user)
    end
  end

  def add(listing, user) do
    add_listing(listing, user)
  end

  defp add_listing(listing, %{type: "root"} = user) do
    new_listing = Ecto.build_assoc(user, :listings)
    listing_changeset = Listing.changeset(new_listing, listing)
    Repo.insert(listing_changeset)
  end

  def update(listing_id, listing, user) do
    u_listing = Ecto.build_assoc(user, :listings)
    u_listing = Map.put(u_listing, :id, listing_id)
    cs = Listing.changeset(u_listing, listing)
    Repo.update(cs)
  end

  def delete(%Listing{id: id}) do
    delete_w_id(id)
  end

  def delete(id) when is_number(id) do
    delete_w_id(id)
  end
  
  defp delete_w_id(id) when is_number(id) do
    query = from l in Listing,
      where: [parent_id: ^id]

    results = Repo.all(query) 
    Enum.map(results, fn l -> delete(l.id) end)

    delete_one(%Listing{id: id})
  end

  def delete_one(%Listing{} = listing) do
    Repo.delete(listing)
  end

  # defp enrich_w_child_sequence_id(listing, sequence_id) do
  #   %{listing | child_sequence_id: sequence_id}
  # end

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

  # def add(%{ "parent_id" => parent_id } = listing, user) when is_number(parent_id) do
  #   new_listing = Ecto.build_assoc(user, :listings)
  #   listing_changeset = Listing.changeset(new_listing, listing)
  #   sequence_id = get_next_child_sequence_id(parent_id)
  #   multi_query = Ecto.Multi.new
  #     |> Multi.insert(:listing, listing_changeset)
  #     |> Multi.run(
  #       :child_listing, 
  #       fn changes_so_far -> 
  #         %{listing: result} = changes_so_far
  #         listing_id = result.id
  #         child_listing_changeset = ChildListing.insert_changeset(%ChildListing{}, %{parent_id: parent_id, listing_id: listing_id, sequence_id: sequence_id})
  #         Repo.insert(child_listing_changeset)
  #       end 
  #     )

  #   case Repo.transaction(multi_query) do
  #     {:ok, %{listing: listing, child_listing: _}} ->
  #       enriched_listing = listing 
  #         |> enrich_w_child_sequence_id(sequence_id)

  #       {:ok, enriched_listing }
  #     {:error, key_that_errored, %{
  #         listing: _, 
  #         child_listing: _
  #       } = result
  #     } ->
  #       #IO.puts("Insert not successful")
  #       #IO.inspect(result)
  #       val = Map.fetch(result, key_that_errored)
  #       {:error, {listing, %{errors: errors_to_map(val.errors)}}}
  #   end
  # end

  # def update_recursive(%{ "id" => id} = listing, user) do
  #   case Repo.one(Shared.Listing, parent_id) do
  #     nil -> {:error, {listing, "invalid parent id"}}
  #     _ -> 
  #       case Repo.one(Shared.Listing, id) do
  #         nil -> {:error, {listing, "invalid listing id"}}
  #         _ -> update_listing(listing, user)
  #       end
  #   end
  # end

  # def update(listing, user) do
  #   update_listing(listing, user)
  # end

  # defp update_listing(listing, %{type: "root"}) do
  #   updated_listing = Ecto.build_assoc(user, :listings)
  #   listing_changeset = Listing.changeset(updated_listing, listing)
  #   Repo.update(listing_changeset)
  # end

  # defp add_listing(listing, user) do
  #   new_listing = Ecto.build_assoc(user, :listings)
  #   new_user_listing = Ecto.build_assoc(user, :user_listings)
  #   listing_changeset = Listing.changeset(new_listing, listing)

  #   sequence_id = get_next_user_sequence_id(user.id)
  #   multi_query = Ecto.Multi.new
  #     |> Multi.insert(:listing, listing_changeset)
  #     |> Multi.run(
  #       :user_listing, 
  #       fn changes_so_far -> 
  #         %{listing: result} = changes_so_far
  #         listing_id = result.id
  #         user_listing_changeset = UserListing.insert_changeset(new_user_listing, %{listing_id: listing_id, sequence_id: sequence_id})
  #         Repo.insert(user_listing_changeset)
  #       end 
  #     )

  #   case Repo.transaction(multi_query) do
  #     {:ok, %{listing: listing, user_listing: _}} ->
  #       enriched_listing = listing 
  #         |> enrich_w_user_sequence_id(sequence_id)

  #       {:ok, enriched_listing}
  #     {:error, key_that_errored, %{
  #         listing: _, 
  #         user_listing: _
  #       } = result
  #     } ->
  #       #IO.puts("Insert not successful")
  #       #IO.inspect(result)
  #       val = Map.fetch(result, key_that_errored)
  #       {:error, {listing, %{errors: errors_to_map(val.errors)}}}
  #   end
  # end 

end