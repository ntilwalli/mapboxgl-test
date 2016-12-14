defmodule Standard.PerformerSignUp do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, Standard.PerformerSignUpData
  end

  @allowed_fields [:type]
  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, [
      "not_specified",
      "in_person", 
      "pre_registration", 
      "in_person_and_pre_registration"
    ])
    |> cast_embed(:data, required: true)
  end
end