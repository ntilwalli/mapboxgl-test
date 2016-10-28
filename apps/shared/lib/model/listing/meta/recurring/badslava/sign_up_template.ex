defmodule Shared.Model.Listing.Meta.Badslava.SignUp.Template do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :start, :integer
    field :end, :integer
    field :methods, {:array, :map}
    field :styles, {:array, :string}
  end

  @allowed_fields [
    :start, :end, 
    :methods, :styles
  ]
  @required_fields [:methods, :styles]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end