defmodule Shared.UserChildListing do
  use Shared.Lib, :model

  @derive {Poison.Encoder, only: [
    :handle, :sequence_id
  ]}
  @primary_key false
  schema "user_child_listings" do
    field :sequence_id, :integer
    field :handle, :string

    belongs_to :user, Shared.User
    belongs_to :listing, Shared.Listing, primary_key: true
  end

  @allowed_fields [:listing_id, :user_id, :sequence_id, :handle]
  @required_fields_insert  [:listing_id, :user_id, :sequence_id]
  @required_fields_update  [:listing_id, :handle]

  def insert_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_insert)
    |> assoc_constraint(:user)
    |> assoc_constraint(:listing)
  end

  def update_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_update)
    |> assoc_constraint(:user)
    |> assoc_constraint(:listing)
  end
end