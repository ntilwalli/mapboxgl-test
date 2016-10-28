defmodule Shared.Model.Listing.Meta.Badslava.CheckIn.Template do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :start, :integer
    field :end, :integer
    field :methods, {:array, :string}
  end

  @allowed_fields [ :start, :end, :methods ]
  @required_fields []
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end