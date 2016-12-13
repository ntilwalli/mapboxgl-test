defmodule Standard.CheckIn do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :begins, Standard.RelativeTime
    embeds_one :ends, Standard.RelativeTime
    field :radius, :integer
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:styles])
    |> cast_embed(:begins, required: true)
    |> cast_embed(:ends, required: true)
    |> validate_number(:radius, greater_than: 0)
  end
end