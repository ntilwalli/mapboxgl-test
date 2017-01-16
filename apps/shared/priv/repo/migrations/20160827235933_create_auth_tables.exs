defmodule Shared.Repo.Migrations.CreateAuthTables do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :name, :string
      add :username, :string
      add :email, :citext
      add :type, :string

      timestamps()
    end

    create index(:users, [:username], unique: true)

    create table(:authorizations) do
      add :provider, :string, null: false
      add :uid, :string
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token, :text, null: false
      add :refresh_token, :text
      add :expires_at, :bigint
      add :profile, :map

      timestamps()
    end

    create index(:authorizations, [:provider, :uid], unique: true)
    create index(:authorizations, [:expires_at])
    create index(:authorizations, [:provider, :token])


    create table(:guardian_tokens, primary_key: false) do
      add :jti, :string, primary_key: true
      add :aud, :string
      add :iss, :string
      add :sub, :string
      add :exp, :bigint
      add :jwt, :text
      add :claims, :map
      add :typ, :string

      timestamps()
    end

    create index(:guardian_tokens, [:typ])
  end
end
