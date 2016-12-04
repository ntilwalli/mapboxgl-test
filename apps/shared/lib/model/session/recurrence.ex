defmodule Shared.Model.Session.Recurrence do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :data, :string
    field :rrule, :map
    field :start_time, :map
    field :end_time, :map
    field :start_date, :map
    field :end_date, :map
  end

  @required_fields []
  @allowed_fields [:type, :data, :rrule, :start_time, :end_time, :start_date, :end_date]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end