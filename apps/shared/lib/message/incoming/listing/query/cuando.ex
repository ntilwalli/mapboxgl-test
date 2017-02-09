defmodule Listing.Query.Cuando do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :begins, :utc_datetime
    field :ends, :utc_datetime
  end

  @allowed_fields [:begins, :ends]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
  end
end