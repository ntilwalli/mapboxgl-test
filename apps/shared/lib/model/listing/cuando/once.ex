defmodule Shared.Model.Once do
  use Shared.Lib, :model

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :begins, :utc_datetime
    field :ends, :utc_datetime
  end

  @allowed_fields [:begins, :ends]
  @required_fields [:begins]
  
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end