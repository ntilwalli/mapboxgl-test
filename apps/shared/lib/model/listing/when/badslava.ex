defmodule Shared.Model.Listing.When.Badslava do
  use Shared.Lib, :model
  # import Timex

  # alias Timex.Ecto.Time
  # alias Timex.Ecto.Date
  # alias Timex.Ecto.DateTime

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :frequency, :string
    field :on, :string
    field :start_time, :time
    field :duration, :time
    field :activates, :date
    field :deactivates, :date
    field :exdate, {:array, :date}
  end

  @allowed_fields [:frequency, :on, :start_time, :duration, :activates, :deactivates, :exdate]
  @required_fields [:frequency, :on, :start_time]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:frequency, ["weekly", "monthly", "bi-weekly"])
  end
end