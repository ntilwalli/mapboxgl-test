defmodule Shared.Model.Listing.When.Once do
  use Shared.Lib, :model

  #alias Timex.Ecto.DateTime

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :start, :utc_datetime
    field :end, :utc_datetime
  end

  @allowed_fields [:start, :end]
  @required_fields [:start]
  
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end