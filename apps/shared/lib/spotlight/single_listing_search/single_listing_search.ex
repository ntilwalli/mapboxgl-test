defmodule Shared.SingleListingSearch do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  schema "single_listing_search" do
    field :begins, :utc_datetime
    field :geom, Geo.Geometry
    belongs_to :listing, Shared.Listing, primary_key: true
  end

  @required_fields [:begins, :geom, :listing_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> assoc_constraint(:listing)
  end
end