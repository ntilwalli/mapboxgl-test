defmodule Shared.GroupChildListing do
  use Shared.Lib, :model

  @primary_key false
  schema "group_child_listings" do
    field :sequence_id, :integer
    field :handle, :string

    belongs_to :listing, Shared.Listing, primary_key: true
    belongs_to :parent, Shared.Listing
  end

  @allowed_fields [:listing_id, :parent_id, :sequence_id, :handle]
  @required_fields_insert  [:listing_id, :parent_id, :sequence_id]
  @required_fields_update  [:listing_id, :handle]

  def insert_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_insert)
    |> assoc_constraint(:parent)
    |> assoc_constraint(:listing)
  end

  def update_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_update)
    |> assoc_constraint(:parent)
    |> assoc_constraint(:listing)
  end
end