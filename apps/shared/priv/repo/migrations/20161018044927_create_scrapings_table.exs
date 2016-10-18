defmodule Shared.Repo.Migrations.CreateScrapingsTable do
  use Ecto.Migration

  def change do
    create table(:scrapings, primary_key: false) do
      add :listing, :map
      add :source, :string
    end
  end
end
