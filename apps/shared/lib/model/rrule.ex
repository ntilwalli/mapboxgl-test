defmodule Shared.Model.RRule do
  use Shared.Lib, :model

  embedded_schema do
    field :freq, :string, null: false
    field :dtstart, :naive_datetime
    field :until, :naive_datetime
    field :interval, :integer
    field :wkst, :string, default: "monday"
    field :count, :integer
    field :bysetpos, {:array, :integer}
    field :byweekday, {:array, :string}
  end

  @allowed_fields [:freq, :dtstart, :interval, :wkst, :count, :bysetpos, :byweekday]
  @required_fields [:freq]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end