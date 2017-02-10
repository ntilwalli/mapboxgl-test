defmodule ListingSession.Properties.Cuando do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :recurrence, ListingSession.Properties.Recurrence
    field :date, :utc_datetime
    field :start_time, :map
    field :end_time, :map
  end

  @allowed_fields [:date, :start_time, :end_time]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> cast_embed(:recurrence)
  end
end