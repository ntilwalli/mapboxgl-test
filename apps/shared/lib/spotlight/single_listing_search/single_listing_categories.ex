defmodule Shared.SingleListingCategories do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  schema "single_listing_categories" do
    field :category, :string
    belongs_to :listing, Shared.Listing
  end

  @required_fields [:category, :listing_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> assoc_constraint(:listing)
  end
end