defmodule Shared.Model.Listing.Meta.Standard.StageTime.MinutesType do
  use Shared.Lib, :model
  import Shared.Helpers
  import Shared.Model.Listing.Meta.Standard

  # :minutes_max
  # :minutes_range

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, Shared.Model.Listing.Meta.Standard.StageTime.MinutesData
  end

  @required_fields [:type, :data]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, ["max", "range"])
    |> Helpers.atomize_type
    |> cast_embed(:data, required: true)
  end
end