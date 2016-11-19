defmodule Shared.Model.Region do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :position, Shared.Message.LngLat
    embeds_one :geotag, Shared.Model.Geotag
  end


  def changeset(model, params \\ :empty) do
    model
    |> cast(params, [])
    |> cast_embed(:position, required: true)
    |> cast_embed(:geotag, required: true)
  end
end