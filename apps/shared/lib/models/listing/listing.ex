defmodule Shared.Listing do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__, :user_listings, :child_listings, :global_handles, :user]}
  @primary_key {:id, :id, autogenerate: true}
  schema "listings" do
    field :parent_id, :id
    field :profile, :map
    field :type, :string

    belongs_to :user, Shared.User
    has_one :user_listings, Shared.UserListing
    has_many :child_listings, Shared.ChildListing
    has_one :global_handles, Shared.GlobalHandle

    timestamps

  end

  @allowed_fields [:id, :parent_id, :user_id, :profile, :type]
  @required_fields_insert  [:user_id, :type]
  @required_fields_update  [:id, :user_id, :type]

  def insert_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_insert)
    |> foreign_key_constraint(:user_id)
  end

  def update_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_update)
    |> foreign_key_constraint(:user_id)
  end
end