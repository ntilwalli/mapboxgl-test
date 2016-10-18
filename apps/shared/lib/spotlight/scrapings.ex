defmodule Shared.Scrapings do
  use Shared.Lib, :model
  import Shared.Helpers

  @primary_key false
  schema "scrapings" do
    field :listing, :map
    field :source, :string
  end

  @required_fields [:source, :listing]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:source, ["badslava"])
    |> cast_dynamic(:source, :listing, %{"badslava" => Badslava.Listing}, required: true)
  end
end