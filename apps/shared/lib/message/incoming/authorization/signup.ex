defmodule Shared.Message.Incoming.Authorization.Signup do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :name, :string
    field :email, :string
    field :username, :string
    field :password, :string
    field :type, :string
  end

  @required_fields [:name, :email, :username, :password, :type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end