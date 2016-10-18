defmodule Common.LngLat do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :lng, :float
    field :lat, :float
    field :timezone, :string
  end

  @required_fields [:lng, :lat]

  def changeset(model, params \\ %{}) do
    model
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_number(:lng, greater_than_or_equal_to: -180.0, less_than_or_equal_to: 180.0)
    |> validate_number(:lat, greater_than_or_equal_to: -90.0, less_than_or_equal_to: 90.0)
    |> add_timezone()
  end
end