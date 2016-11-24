defmodule Shared.Repo.Migrations.CreateListingSessionsTable do
  use Ecto.Migration

  def change do
    create table(:listing_sessions) do
      add :listing, :map
      add :search_area, :map
      add :current_step, :string
      add :user_id, references(:users, on_delete: :delete_all, type: :bigserial), null: false
      timestamps
  end
  end
end
