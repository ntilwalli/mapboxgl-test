defmodule Standard.PerformerSignUp.PreRegistration do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :begins, Standard.RelativeTime
    embeds_one :ends, Standard.RelativeTime
    field :data, :string
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:type, :data])
    |> validate_required([:type])
    |> validate_inclusion(:type, [
      "app", 
      "email", 
      "website"
    ])
    |> cast_embed(:begins)
    |> cast_embed(:ends)

  end
end