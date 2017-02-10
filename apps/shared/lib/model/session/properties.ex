defmodule ListingSession.Properties do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :donde, ListingSession.Properties.Donde
    embeds_one :cuando, ListingSession.Properties.Cuando
    field :admin, :map
  end

  @allowed_fields [:admin]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> cast_embed(:donde)
    |> cast_embed(:cuando)
  end
end