defmodule Shared.Model.Search.Query.Center do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :lng, :float
    field :lat, :float
  end

  @required_fields [:lng, :lat]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end