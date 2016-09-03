defmodule Shared.Authorization do
  use Shared.Lib, :model

  schema "authorizations" do
    field :uid, :string
    field :provider, :string
    field :token, :string
    field :refresh_token, :string
    field :expires_at, :integer
    field :profile, :map

    belongs_to :user, Shared.User
    timestamps
  end

  @required_fields ~w(uid provider user_id)
  @optional_fields ~w(token refresh_token expires_at)

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint(:uid, name: :authorizations_provider_uid_index)
  end

end
