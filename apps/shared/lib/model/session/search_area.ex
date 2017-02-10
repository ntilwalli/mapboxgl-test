defmodule ListingSession.Properties.SearchArea do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :region, Shared.Model.Region
    field :radius, :integer
  end

  @required_fields [:radius]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:region, required: true)
  end
end