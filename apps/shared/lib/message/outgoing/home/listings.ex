defmodule Home.Listings.Outgoing do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_many :sessions, Shared.ListingSession
    embeds_many :staged, Shared.Listing
    embeds_many :posted, Shared.Listing
  end

  @required_fields []
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [])
    |> cast_embed(:listing_sessions)
    |> cast_embed(:staged)
    |> cast_embed(:posted)
  end
end