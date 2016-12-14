defmodule Standard.PerformerLimit do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, Standard.PerformerLimitData
  end

  @allowed_fields [:type]
  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, [
      "not_specified",
      "no_limit", 
      "limit", 
      "limit_by_sign_up_type"
    ])
    |> cast_embed(:data, required: true)
  end
end