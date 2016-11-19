defmodule Shared.Repo.Migrations.CreateSettingsTable do
  use Ecto.Migration

  def change do
    create table(:settings, primary_key: false) do
      add :use_region, :string, null: false
      add :override_region, :map
      add :home_region, :map, null: false
      add :user_id, references(:users, on_delete: :delete_all, type: :bigserial), primary_key: true
    end
  end
end
