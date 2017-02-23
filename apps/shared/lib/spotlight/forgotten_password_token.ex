defmodule Shared.ForgottenPasswordToken do
  use Shared.Lib, :model

  @primary_key false
  schema "forgotten_password_tokens" do
    belongs_to :user, Shared.User, primary_key: true
    field :token, :string
    field :expires_at, :utc_datetime

    timestamps()
  end

  @allowed_fields [:user_id, :token, :expires_at]
  @required_fields [:user_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end