defmodule Shared.ChildListing do
  use Shared.Lib, :model

  @primary_key false
  schema "child_listings" do
    field :sequence_id, :integer, primary_key: true
    field :handle, :string
    belongs_to :listing, Shared.Listing
    belongs_to :parent, Shared.Listing, primary_key: true
  end

  @allowed_fields [:listing_id, :parent_id, :sequence_id, :handle]
  @required_fields_insert  [:parent_id, :sequence_id, :listing_id]
  @required_fields_update  [:parent_id, :sequence_id, :handle]

  def insert_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_insert)
    |> assoc_constraint(:listing)
  end

  def update_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_update)
    |> assoc_constraint(:listing)
  end

end