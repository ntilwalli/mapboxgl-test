defmodule Incoming.Authorization.ResetPassword do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :token, :string
    field :password, :string
  end

  @required_fields [:token, :password]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end