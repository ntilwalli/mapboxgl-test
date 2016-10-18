defmodule Listing.Location.Badslava do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :name, :string
    field :street, :string
    field :city, :string
    field :stateAbbr, :string
    embeds_one :lng_lat, Common.LngLat
    field :timezone, :string
  end

  @required_fields [:name, :street, :city, :stateAbbr]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:lng_lat, required: true)
  end
end