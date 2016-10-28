defmodule Shared.Model.Listing.Meta.Badslava.StartEnd do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :start, :naive_datetime
    field :end, :naive_datetime
  end

  @allowed_fields [:start, :end]
  @required_fields [:start]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end