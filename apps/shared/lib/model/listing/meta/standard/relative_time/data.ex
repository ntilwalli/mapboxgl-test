defmodule Standard.RelativeTimeData do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :day, :string
    embeds_one :time, Standard.MilitaryTime
    field :minutes, :integer
  end

  @fields [:day, :minutes]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @fields)
    |> validate_number(:minutes, greater_than_or_equal_to: 0)
    |> validate_inclusion(:day, ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"])
    |> cast_embed(:time)
  end
end