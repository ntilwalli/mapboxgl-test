defmodule Standard.ContactInfo do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :email, :string
    field :twitter, :string
    field :facebook, :string
    field :instagram, :string
    field :website, :string
  end

  @allowed_fields [:email, :twitter, :facebook, :instagram, :website]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
  end
end