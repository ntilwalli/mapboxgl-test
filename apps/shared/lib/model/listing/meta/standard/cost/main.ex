defmodule Standard.Cost do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, Standard.CostData
  end

  @allowed_fields [:type]
  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, [
      "free", 
      "cover", 
      "minimum_purchase",
      "cover_and_minimum_purchase",
      "cover_or_minimum_purchase"
    ])
    |> cast_embed(:data, required: true)
  end
end