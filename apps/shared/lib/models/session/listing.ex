defmodule ListingSession.Listing do
  use Shared.Lib, :model

  alias Listing.Profile

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :handle, :string
    field :visibility, :string
    field :parent_id, :id
    embeds_one :profile, Listing.Profile
  end

  @allowed_fields [:parent_id, :type, :visibility, :handle]
  @required_fields []

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> cast_embed(:profile, required: true)
    |> validate_required(@required_fields)
  end
end