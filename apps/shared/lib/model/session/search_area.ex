defmodule Shared.Model.Session.SearchArea do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :center, Shared.Model.LngLat
    embeds_one :region, Shared.Model.Region
    field :radius, :integer
  end

  @required_fields [:center, :region, :radius]
  def changeset(model, params \\ %{}) do
    model
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_number(:radius, greater_than: 0)
    |> cast_embed(:center, required: true)
    |> cast_embed(:region, required: true)
  end
end