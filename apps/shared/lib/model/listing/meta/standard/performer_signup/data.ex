defmodule Standard.PerformerSignUpData do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :in_person, Standard.PerformerSignUp.InPerson
    embeds_one :pre_registration, Standard.PerformerSignUp.PreRegistration
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [])
    |> cast_embed(:in_person)
    |> cast_embed(:pre_registration)
  end
end