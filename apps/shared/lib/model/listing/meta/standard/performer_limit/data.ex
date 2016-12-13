defmodule Standard.PerformerLimitData do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :limit, :integer
    embeds_one :in_person, Standard.PerformerLimit.ByType
    embeds_one :pre_registration, Standard.PerformerLimit.ByType
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:limit])
    |> cast_embed(:in_person)
    |> cast_embed(:pre_registration)
  end
end