defmodule Standard.StageTime do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, Standard.StageTimeData
  end

  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, ["see_notes", "minutes", "songs", "minutes_or_songs"])
    |> cast_embed(:data)
  end
end