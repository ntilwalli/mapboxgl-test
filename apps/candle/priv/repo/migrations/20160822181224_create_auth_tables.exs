defmodule Candle.Repo.Migrations.CreateAuthTables do
  use Ecto.Migration

  def change do
    execute("CREATE EXTENSION citext;")

    create table(:users) do
      add :name, :string
      add :username, :string
      add :email, :citext
      add :type, :string

      timestamps
    end

    create index(:users, [:username], unique: true)

    create table(:authorizations) do
      add :provider, :string
      add :uid, :string
      add :user_id, references(:users, on_delete: :delete_all)
      add :token, :text
      add :refresh_token, :text
      add :expires_at, :bigint
      add :image_url, :string
      add :profile_url, :string
      add :verified, :boolean
      add :verification_token, :string

      timestamps
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

      timestamps
    end

    create index(:guardian_tokens, [:typ])
  end
end
