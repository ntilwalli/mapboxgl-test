defmodule Shared.Model.Listing.Meta.Standard.StageTime.Data do
  use Shared.Lib, :model

  # :minutes_max
  # :minutes_range

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :minutes, Shared.Model.Listing.Meta.Standard.StageTime.MinutesData
    field :songs, :integer
  end

  def minutes_changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [])
    |> cast_embed(:minutes, required: true)
  end

  @songs_required [:songs]

  def songs_changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @songs_required)
    |> validate_required(@songs_required)
  end

  def minutes_or_songs_changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @songs_required)
    |> validate_required(@songs_required)
    |> cast_embed(:minutes, required: true)
  end

end