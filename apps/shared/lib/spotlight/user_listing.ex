defmodule Shared.UserListing do
  use Shared.Lib, :model

  @primary_key false
  schema "user_listings" do
    field :sequence_id, :integer, primary_key: true
    field :handle, :string

    belongs_to :user, Shared.User, primary_key: true
    belongs_to :listing, Shared.Listing
  end

  @allowed_fields [:listing_id, :user_id, :sequence_id, :handle]
  @required_fields_insert  [:user_id, :sequence_id, :listing_id]
  @required_fields_update  [:user_id, :sequence_id, :handle]

  def insert_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_insert)
    |> assoc_constraint(:user)
  end

  def update_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_update)
    |> assoc_constraint(:user)
  end



end