defmodule Standard.Cost.MinimumPurchase do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :data, :float
    field :type, :string
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:type, :data])
    |> validate_required([:type, :data])
    |> validate_inclusion(:type, ["dollars", "item", "drink", "drink_or_item"])
    |> validate_number(:data, greater_than: 0)
  end
end