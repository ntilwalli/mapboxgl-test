defmodule Shared.SingleListingTypes do
  use Shared.Lib, :model
  
  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  schema "single_listing_types" do
    field :type, :string
    belongs_to :listing, Shared.Listing
  end

  @required_fields [:type, :listing_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end