defmodule Listing.Query do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :types, {:array, :string}
    field :releases, {:array, :string}
    field :visibilities, {:array, :string}
    field :parent_id, :integer
    embeds_one :donde, Listing.Query.Donde
    embeds_one :cuando, Listing.Query.Cuando
    embeds_one :meta, Listing.Query.Meta
  end

  @allowed_fields [:types, :releases, :parent_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> cast_embed(:donde)
    |> cast_embed(:cuando)
    |> cast_embed(:meta)
  end
end