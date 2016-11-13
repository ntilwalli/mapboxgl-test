defmodule Shared.Model.Listing.Settings.Badslava.CheckIn do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :begins, :integer
    field :ends, :integer
    field :radius, :integer
  end

  @allowed_fields [:begins, :ends, :radius]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
  end
end