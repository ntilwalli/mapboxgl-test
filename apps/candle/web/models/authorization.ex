defmodule Candle.Authorization do
  #@derive {Poison.Encoder, except: [:__meta__]}
  use Candle.Web, :model

  schema "authorizations" do
    field :uid, :string
    field :provider, :string
    field :token, :string
    field :refresh_token, :string
    field :expires_at, :integer
    field :image_url, :string
    field :profile_url, :string
    field :verified, :boolean
    field :verification_token, :string
    field :password, :string, virtual: true
    field :password_confirmation, :string, virtual: true

    belongs_to :user, Candle.User
    timestamps
  end

  @required_fields ~w(uid provider user_id)
  @optional_fields ~w(token refresh_token expires_at image_url profile_url verified verification_token)

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint(:provider_uid)
  end

end
