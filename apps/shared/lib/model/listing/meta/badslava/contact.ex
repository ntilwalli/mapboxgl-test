defmodule Shared.Model.Listing.Meta.Badslava.Contact do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :email, :string
    field :email_name, :string
    field :website, :string
    field :twitter, :string
    field :instagram, :string
    field :facebook, :string
    field :phone, :string
    field :note, :string
  end

  @allowed_fields [
    :email, :email_name, :website, :twitter, :instagram, 
    :facebook, :phone, :note
  ]

  @required_fields []

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end