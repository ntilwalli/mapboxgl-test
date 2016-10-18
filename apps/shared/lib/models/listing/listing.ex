defmodule Shared.Listing do
  use Shared.Lib, :model
  import Shared.Helpers

  #alias Listing.Location
  alias Listing.Location.Badslava
  alias Listing.DateTime.Recurring
  alias Listing.DateTime.Once

  @derive {Poison.Encoder, except: [:__meta__, :user_listings, :child_listings, :sort_id]}
  @primary_key {:id, :id, autogenerate: true}
  schema "listings" do
    field :sort_id, :id
    field :parent_id, :id
    field :type, :string
    field :handle, :string
    field :release, :string
    field :visibility, :string
    field :title, :string
    field :description, :string
    field :short_description, :string
    field :event_types, {:array, :string}
    field :categories, {:array, :string}
    field :location, :map#Location,
    field :date_time, :map#DateTime
    field :source, :string
    field :user_sequence_id, :id, virtual: true
    field :child_sequence_id, :id, virtual: true

    belongs_to :user, Shared.User
    has_one :user_listings, Shared.UserListing
    has_many :child_listings, Shared.ChildListing

    timestamps
  end

  @allowed_fields [
    :id, :parent_id, :user_id, :type, :release, :visibility, :handle, :source,
    :title, :description, :short_description, :event_types, :categories,
    :location, :date_time
  ]
  @required_fields [
    :user_id, :type, :visibility, :release, 
    :location, :date_time
  ]

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, ["single", "recurring", "badslava"])
    |> validate_inclusion(:visibility, ["public", "private", "hidden"])
    |> assoc_constraint(:user)
    # |> inspect_changeset
    |> cast_dynamic(:type, :location, %{"badslava" => Listing.Location.Badslava}, required: true)
    |> cast_dynamic(:type, :date_time, %{"badslava" => Listing.DateTime.Badslava}, required: true)
  end
end