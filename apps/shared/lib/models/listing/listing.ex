defmodule Shared.Listing do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__, :user_listings, :child_listings, :user, :sort_id]}
  @primary_key {:id, :id, autogenerate: true}
  schema "listings" do
    field :sort_id, :id
    field :parent_id, :id
    field :profile, :map
    field :type, :string
    field :handle, :string
    field :release, :string
    field :visibility, :string
    field :user_sequence_id, :integer, virtual: true
    field :child_sequence_id, :integer, virtual: true

    belongs_to :user, Shared.User
    has_one :user_listings, Shared.UserListing
    has_many :child_listings, Shared.ChildListing

    timestamps
  end

  @allowed_fields [:id, :parent_id, :user_id, :profile, :type, :release, :visibility, :handle]
  @required_fields_insert  [:user_id, :profile, :type, :visibility, :release]
  @required_fields_update  [:profile, :type, :visibility, :release]

  def insert_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_insert)
    |> assoc_constraint(:user)
    |> foreign_key_constraint(:release)
    |> foreign_key_constraint(:visibility)
  end

  def update_changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields_update)
    |> assoc_constraint(:user)
    |> foreign_key_constraint(:release)
    |> foreign_key_constraint(:visibility)
  end
end