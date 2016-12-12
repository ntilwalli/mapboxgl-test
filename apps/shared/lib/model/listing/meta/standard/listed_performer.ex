defmodule Shared.Model.Listing.Meta.Standard.ListedPerformer do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :name, :string
    field :title, :integer
  end

  @allowed_fields [:name, :title]
  @required_fields [:name]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end