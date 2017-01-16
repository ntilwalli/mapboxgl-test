defmodule Shared.Repo.Migrations.CreateScrapingsTable do
  use Ecto.Migration

  def change do
    create table(:scrapings, primary_key: false) do
      add :data, :map, null: false
      add :source, :string, null: false
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial), primary_key: true
      timestamps()
    end
  end
end
