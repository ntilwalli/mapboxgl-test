defmodule Shared.Listing do
  use Shared.Lib, :model
  import Shared.Helpers

  #alias Listing.Location
  # alias Shared.Model.Listing.When
  # alias When.Badslava
  # alias When.Recurring
  # alias When.Once

  @derive {Poison.Encoder, except: [
    :__meta__, :sort_id, :source, :user_id, :parent, :children,
    #:group_child_listings, :user_child_listings,
    :single_listing_search, :single_listing_categories, 
    :single_listing_event_types, :check_ins, :inserted_at, :updated_at
  ]}

  @primary_key {:id, :id, autogenerate: true}
  schema "listings" do
    field :sort_id, :id
    field :type, :string
    field :handle, :string
    field :release, :string
    field :visibility, :string
    field :cuando, :map
    field :donde, :map
    field :meta, :map
    field :settings, :map
    field :source, :string
    # field :user_child_sequence_id, :id, virtual: true
    # field :group_child_sequence_id, :id, virtual: true

    belongs_to :user, Shared.User
    belongs_to :parent, Shared.Listing

    has_one :user_child_listing, Shared.UserChildListing
    has_many :group_child_listings, Shared.GroupChildListing
    has_one :single_listing_search, Shared.SingleListingSearch
    has_many :single_listing_categories, Shared.SingleListingCategories
    has_many :single_listing_event_types, Shared.SingleListingEventTypes
    has_many :check_ins, Shared.CheckIn
    has_many :children, Shared.Listing, foreign_key: :parent_id

    timestamps
  end

  @allowed_fields [
    :id, :parent_id, :user_id, :type, :release, :visibility, 
    :cuando, :donde, :meta, :settings,
    :handle, :source,
  ]
  
  @required_fields [
    :user_id, :type, :visibility, :release, :cuando, :donde, :meta, :settings
  ]

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, ["single", "recurring"])
    |> validate_inclusion(:visibility, ["public", "private", "hidden"])
    |> cast_dynamic_parent_flag(:type, :cuando, %{"recurring" => Shared.Model.Recurring, "single" => Shared.Model.Listing.Cuando.Once})
    # |> cast_dynamic_func(:meta, fn cs, dynamic_val -> 
      #   # IO.inspect dynamic_val
      #   changes = cs.changes
      #   # type = changes["type"]
      #   # IO.inspect changes

      #   type = cond do
      #     val = Map.get(changes, :type) -> val
      #     val = Map.get(changes, "type") -> val
      #     true -> :error
      #   end

      #   dynamic_type = cond do
      #     val = Map.get(dynamic_val, :type) -> val
      #     val = Map.get(dynamic_val, "type") -> val
      #     true -> :error
      #   end

      #   case type do
      #     "recurring" ->
      #       case dynamic_type do
      #         "badslava" -> Shared.Model.Listing.Meta.Badslava.Template
      #         _ -> nil
      #       end
      #     "single" -> 
      #       case dynamic_type do
      #         "badslava" -> Shared.Model.Listing.Meta.Badslava
      #         _ -> nil
      #       end
      #     _ -> nil
      #   end
      # end)
    |> cast_dynamic(:meta, %{
      "badslava" => Shared.Model.Listing.Meta.Badslava,
      "standard" => Meta.Standard
    })
    |> cast_dynamic(:donde, %{
      "badslava" => Donde.Badslava,
      "venue" => Donde.Venue
    })
    |> assoc_constraint(:user)
    |> assoc_constraint(:parent)

    # |> inspect_changeset
    # |> cast_dynamic(:type, :donde, %{
    #     "badslava_recurring" => Shared.Model.Listing.Where.Badslava,
    #     "badslava_single" => Shared.Model.Listing.Where.Badslava
    #   }, required: true)
    # |> cast_dynamic(:type, :cuando, %{
    #     "badslava_recurring" => Shared.Model.Listing.When.Recurring,
    #     "badslava_single" => Shared.Model.Listing.When.Once
    #   }, required: true)
  end
end