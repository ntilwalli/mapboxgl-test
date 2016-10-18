defmodule Shared.Model.Listing.When.Recurring do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :rdate, :string
    field :rrule, :string
    field :exdate, :string
  end

  @allowed_fields [:rdate, :rrule, :exdate]
  @require_one_fields [:rdate, :rrule]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_require_one(@require_one_fields)
  end
end