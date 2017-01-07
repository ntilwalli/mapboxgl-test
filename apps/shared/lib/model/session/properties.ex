defmodule ListingSession.Properties do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :search_area, ListingSession.SearchArea
    embeds_one :recurrence, ListingSession.Recurrence
  end

  @allowed_fields []
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> cast_embed(:search_area)
    |> cast_embed(:recurrence)
  end
end