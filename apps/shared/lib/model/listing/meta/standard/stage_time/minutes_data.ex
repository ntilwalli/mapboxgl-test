defmodule Standard.StageTime.MinutesData do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :min, :float
    field :max, :float
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:min, :max])
    |> validate_required([:max])
    |> validate_number(:min, greater_than: 0)
    |> validate_number(:max, greater_than: 0)
  end
end