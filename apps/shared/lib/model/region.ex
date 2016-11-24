defmodule Shared.Model.Region do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :position, Shared.Message.LngLat
    field :geotag, :map
    embeds_one :city_state, Shared.Model.CityState
  end


  def changeset(model, params \\ :empty) do
    model
    |> cast(params, [:geotag])
    |> cast_embed(:position, required: true)
    |> cast_embed(:city_state, required: true)
  end
end