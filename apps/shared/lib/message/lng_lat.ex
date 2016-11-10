defmodule Shared.Message.LngLat do
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
    |> validate_number(:lng, greater_than_or_equal_to: -180.0, less_than_or_equal_to: 180.0)
    |> validate_number(:lat, greater_than_or_equal_to: -90.0, less_than_or_equal_to: 90.0)
  end
end