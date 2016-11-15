defmodule Shared.Message.Incoming.Search.Query do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :begins, :utc_datetime
    field :ends, :utc_datetime
    field :radius, :float
    embeds_one :center, Shared.Model.LngLat
  end

  @required_fields [:begins, :ends, :radius]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> cast_embed(:center)
    |> validate_required(@required_fields)
  end
end