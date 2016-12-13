defmodule Standard.PerformerLimit.ByType do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :type, :string
    embeds_one :data, :integer
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:type, :data])
    |> validate_required([:type])
    |> validate_inclusion(:type, [
      "no_limit", 
      "limit"
    ])
    |> validate_number(:data, greater_than: 0)
  end
end