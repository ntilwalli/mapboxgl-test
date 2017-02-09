defmodule Listing.Query.Meta do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :categories, {:array, :string}
    field :event_types, {:array, :string}
  end

  @allowed_fields [:categories, :event_types]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
  end
end