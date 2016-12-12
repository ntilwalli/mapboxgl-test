defmodule Shared.Model.Listing.Meta.Standard.StageTime do
  use Shared.Lib, :model
  import Shared.Helpers
  import Shared.Model.Listing.Meta.Standard

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, Standard.StageTime.Data
  end

  @required_fields [:type, :data]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, ["minutes", "songs", "minutes_or_songs"])
    |> Helpers.atomize_type
  end
end