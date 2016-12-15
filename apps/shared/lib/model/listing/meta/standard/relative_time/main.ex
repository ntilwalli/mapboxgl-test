defmodule Standard.RelativeTime do
  use Shared.Lib, :model

  import Shared.Helpers
  #import Shared.Model.Listing.Meta.Standard

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :data, Standard.RelativeTimeData
  end

  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, [
      "upon_posting",
      "previous_weekday_at_time",
      "minutes_before_event_start",
      "event_start",
      "minutes_after_event_start",
      "minutes_before_event_end",
      "event_end"
    ])
    |> cast_embed(:data)
  end
end