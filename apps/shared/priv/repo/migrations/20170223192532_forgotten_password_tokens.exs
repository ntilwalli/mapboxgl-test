defmodule Shared.Repo.Migrations.ForgottenPasswordTokens do
  use Ecto.Migration

  def change do
    create table(:forgotten_password_tokens, primary_key: false) do
      add :user_id, references(:users, on_delete: :delete_all), primary_key: true
      add :token, :string, null: false
      add :expires_at, :utc_datetime
      timestamps()
    end
  end
end
