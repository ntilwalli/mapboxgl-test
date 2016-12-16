defmodule Standard.CostData do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :cover, :float
    embeds_one :minimum_purchase, Standard.Cost.MinimumPurchase
    embeds_one :cost_per_minute, Standard.Cost.CostPerMinute
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:cover])
    |> cast_embed(:minimum_purchase)
    |> cast_embed(:cost_per_minute)
  end
end