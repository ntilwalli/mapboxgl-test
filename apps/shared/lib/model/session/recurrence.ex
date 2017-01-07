defmodule ListingSession.Recurrence do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :rules, {:array, :map}
    field :rdates, {:array, :naive_datetime}
    field :exdates, {:array, :naive_datetime}
    field :start_time, :map
    field :end_time, :map
    field :start_date, :naive_datetime
    field :end_date, :naive_datetime
  end

  @required_fields []
  @allowed_fields [:rules, :rdates, :exdates, :start_time, :end_time, :start_date, :end_date]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end