defmodule Shared.Repo.Migrations.CreateEventsTables do
  use Ecto.Migration

  def up do

    create table(:single_listing_search, primary_key: false) do
      add :begins, :utc_datetime, null: false
      add :geom, :geometry, null: false
      add :listing_id, references(:listings, type: :bigserial), primary_key: true
    end

    create index(:single_listing_search, :begins)
    execute("CREATE INDEX single_listing_search_geom_gix ON single_listing_search USING GIST (geom);")

    create table(:single_listing_categories, primary_key: false) do
      add :category, :string, null: false
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial)
    end


    create index(:single_listing_categories, [:category])

    create table(:single_listing_types, primary_key: false) do
      add :type, :string, null: false
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial)
    end

    create index(:single_listing_types, [:type])
  end

  def down do
    drop table(:single_listing_types)
    drop table(:single_listing_categories)
    execute("DROP INDEX single_listing_search_geom_gix;")
    drop table(:single_listing_search)
  end
end
