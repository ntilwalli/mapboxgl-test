defmodule Shared.Model.Region do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :country, :string
    field :state, :string
    field :city, :string
  end

  @required_fields [:country, :state, :city]

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end