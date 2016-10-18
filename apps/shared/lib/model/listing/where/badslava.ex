defmodule Shared.Model.Listing.Where.Badslava do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :name, :string
    field :street, :string
    field :city, :string
    field :state_abbr, :string
    embeds_one :lng_lat, Shared.Model.LngLat
  end

  @required_fields [:name, :street, :city, :state_abbr]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:lng_lat, required: true)
  end
end