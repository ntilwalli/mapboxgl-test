defmodule Standard.StageTimeData do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :minutes, Standard.StageTime.Minutes
    field :songs, :integer
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:songs])
    |> cast_embed(:minutes)
  end
end