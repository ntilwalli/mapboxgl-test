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

  @allowed_fields [:token, :refresh_token, :expires_at, :uid, :provider, :user_id]
  @required_fields [:token, :uid, :provider, :user_id]

  def changeset(model, params \\ :empty) do
    IO.puts "Inspecting"
    IO.inspect params
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint(:uid, name: :authorizations_provider_uid_index)
  end

end
