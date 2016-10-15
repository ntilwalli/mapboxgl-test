defmodule Common.LngLat do
  use Shared.Lib, :model

  embedded_schema do
    field :lng, :float
    field :lat, :float
  end

  @required_fields [:lng, :lat]

  def changeset(model, params \\ %{}) do
    model
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end