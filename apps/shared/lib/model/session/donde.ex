defmodule ListingSession.Properties.Donde do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :modal, :string
    embeds_one :search_area, ListingSession.Properties.SearchArea
  end


  @allowed_fields [:modal]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> cast_embed(:search_area)
    |> validate_required(@required_fields)
  end
end