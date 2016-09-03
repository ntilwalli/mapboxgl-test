defmodule Shared.Repo.Migrations.CreateListingTables do
  use Ecto.Migration

  def change do
    create table(:listings, primary_key: false) do
      add :id, :bigint, primary_key: true, default: fragment("next_insta_id()")
      add :parent_id, :bigint
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :profile, :map, null: false
      add :type, :string, null: false
      
      timestamps
    end

    create index(:listings, [:type])
    create index(:listings, [:parent_id])

    create table(:user_listings, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :sequence_id, :integer, null: false
      add :listing_id, references(:listings, on_delete: :delete_all), null: false
      add :handle, :string
    end

    create unique_index(:user_listings, [:user_id, :sequence_id])
    create unique_index(:user_listings, [:user_id, :handle])
    create unique_index(:user_listings, [:listing_id])

    create table(:child_listings, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :parent_id, references(:listings, on_delete: :delete_all), null: false
      add :listing_id, references(:listings, on_delete: :delete_all), null: false
      add :sequence_id, :integer, null: false
    end

    create unique_index(:child_listings, [:parent_id, :sequence_id])
    create unique_index(:child_listings, [:listing_id])

    create table(:global_handles, primary_key: false) do
      add :listing_id, references(:listings, on_delete: :delete_all), null: false
      add :handle, :string, primary_key: true
    end

    create unique_index(:global_handles, [:listing_id])
  end
end
