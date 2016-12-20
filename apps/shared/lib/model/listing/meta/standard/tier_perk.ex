defmodule Standard.TierPerk do
  use Shared.Lib, :model

  import Shared.Helpers

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :data, :float
  end

  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, [
      "drink_ticket",
      "minutes",
      "songs",
      "priority_order",
      "additional_bucket_entry",
      "minutes_and_priority_order",
      "songs_and_priority_order",
      "additional_minutes",
      "additional_songs",
      "additional_minutes_and_priority_order",
      "additional_songs_and_priority_order"
    ])
  end
end