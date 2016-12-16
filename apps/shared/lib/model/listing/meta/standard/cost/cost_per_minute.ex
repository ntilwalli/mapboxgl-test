defmodule Standard.Cost.CostPerMinute do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :cost, :float
    field :max, :integer
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:cost, :max])
    |> validate_required([:cost, :max])
    |> validate_number(:cost, greater_than: 0)
    |> validate_number(:max, greater_than: 0)
  end
end