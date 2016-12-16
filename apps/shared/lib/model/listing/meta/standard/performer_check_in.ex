defmodule Standard.PerformerCheckIn do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :begins, Standard.RelativeTime
    embeds_one :ends, Standard.RelativeTime
    field :enable_in_app, :boolean
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:enable_in_app])
    |> cast_embed(:begins)
    |> cast_embed(:ends)
  end
end