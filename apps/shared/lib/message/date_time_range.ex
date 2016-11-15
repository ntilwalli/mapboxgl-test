defmodule Shared.Message.DateTimeRange do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :begins, :utc_datetime
    field :ends, :utc_datetime
  end

  @required_fields [:begins, :ends]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end