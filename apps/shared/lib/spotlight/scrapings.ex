defmodule Shared.Scrapings do
  use Shared.Lib, :model
  import Shared.Helpers

  alias Shared.Model.Scraper.BadslavaListing

  @primary_key false#{:listing_id, :id, autogenerate: false}
  schema "scrapings" do
    field :data, :map
    field :source, :string
    belongs_to :listing, Shared.Listing, primary_key: true
    timestamps
  end

  @allowed_fields [:source, :data, :listing_id]
  @required_fields [:source, :data]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:source, ["badslava"])
    |> cast_dynamic(:data, %{"badslava" => BadslavaListing}, required: true)
    |> assoc_constraint(:listing)
  end
end