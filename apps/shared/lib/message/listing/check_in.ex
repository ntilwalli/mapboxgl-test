defmodule Shared.Message.Listing.CheckIn do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :listing_id, :integer
    embeds_one :lng_lat, Shared.Message.LngLat
  end

  @required_fields [:listing_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> cast_embed(:lng_lat)
    |> validate_required(@required_fields)
  end
end