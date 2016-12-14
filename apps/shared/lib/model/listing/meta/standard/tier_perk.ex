defmodule Standard.TierPerk do
  use Shared.Lib, :model

  import Shared.Helpers

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, :float
  end

  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, [
      "no_perk",
      "minutes",
      "songs",
      "priority_order",
      "bucket_entry",
      "minutes_and_priority_order",
      "songs_and_priority_order"
    ])
    |> cast_embed(:data)
  end
end