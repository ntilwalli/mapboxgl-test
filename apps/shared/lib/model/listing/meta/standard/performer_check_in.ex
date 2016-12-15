defmodule Standard.PerformerCheckIn do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :begins, Standard.RelativeTime
    embeds_one :ends, Standard.RelativeTime
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [])
    |> cast_embed(:begins)
    |> cast_embed(:ends)
  end
end