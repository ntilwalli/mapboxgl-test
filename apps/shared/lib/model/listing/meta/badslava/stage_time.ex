defmodule Shared.Model.Listing.Meta.Badslava.StageTime do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :data, :map
  end

  @required_fields [:type, :data]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end