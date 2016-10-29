defmodule Shared.Model.Listing.Meta.Badslava.SignUp do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :begins, :integer
    field :ends, :integer
    field :methods, {:array, :map}
    field :styles, {:array, :string}
  end

  @allowed_fields [:begins, :ends, :methods, :styles]
  @required_fields [:methods, :styles]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end