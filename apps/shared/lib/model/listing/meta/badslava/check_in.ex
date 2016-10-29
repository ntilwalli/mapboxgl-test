defmodule Shared.Model.Listing.Meta.Badslava.CheckIn do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :begins, :integer
    field :ends, :integer
    field :methods, {:array, :map}
  end

  @allowed_fields [:begins, :ends, :methods]
  @required_fields []
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end