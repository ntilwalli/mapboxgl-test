defmodule Standard.RelativeTimeData do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :hour, :integer
    field :minute, :integer
    field :minutes, :integer
  end

  @fields [:hour, :minute, :minutes]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @fields)
    |> validate_required(@fields)
    |> validate_inclusion(:hour, 0..23)
    |> validate_inclusion(:minute, 0..59)
    |> validate_number(:minutes, greater_than_or_equal_to: 0)
  end
end