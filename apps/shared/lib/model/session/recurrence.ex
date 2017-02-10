defmodule ListingSession.Properties.Recurrence do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :rules, {:array, :map}
    field :rdates, {:array, :naive_datetime}
    field :exdates, {:array, :naive_datetime}
    field :start_date, :utc_datetime
    field :end_date, :utc_datetime
  end

  @allowed_fields [:rules, :rdates, :exdates, :start_date, :end_date]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
  end
end