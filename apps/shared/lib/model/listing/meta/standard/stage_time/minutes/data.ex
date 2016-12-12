defmodule Shared.Model.Listing.Meta.Standard.StageTime.MinutesData do
  use Shared.Lib, :model

  # :minutes_max
  # :minutes_range

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :min, :float
    field :max, :float
  end

  def max_changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:max])
    |> validate_required([:max])
  end

  def range_changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:min, :max])
    |> validate_required([:min, :max])
  end
end