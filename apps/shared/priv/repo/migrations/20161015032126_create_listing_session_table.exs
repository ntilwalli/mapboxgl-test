defmodule Shared.Repo.Migrations.CreateListingSessionTable do
  use Ecto.Migration

  def change do
    create table(:create_listing_sessions, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :sort_id, :bigint, default: fragment("next_insta_id()")
      add :user_id, references(:users, on_delete: :delete_all, type: :bigserial), null: false
      add :data, :map, null: false
      timestamps
    end

    create index(:create_listing_sessions, [:user_id])
  end
end
