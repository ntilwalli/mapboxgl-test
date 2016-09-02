defmodule Shared.Repo.Migrations.CreateListingTables do
  use Ecto.Migration

  def change do
    create table(:listings, primary_key: false) do
      add :id, :bigint, primary_key: true, default: fragment("next_insta_id()")
      add :parent_id, :bigint
      add :profile, :map, null: false
      add :is_group, :boolean, null: false
      
      timestamps
    end

    create table(:user_listings, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :sequence_id, :integer, null: false
      add :listing_id, references(:listings, on_delete: :delete_all), null: false
      add :handle, :string
    end

    create index(:user_listings, [:user_id, :sequence_id], unique: true)
    create index(:user_listings, [:user_id, :handle], unique: true)
    create index(:user_listings, [:listing_id], unique: true)

    create table(:child_listings, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :parent_id, references(:listings, on_delete: :delete_all), null: false
      add :listing_id, references(:listings, on_delete: :delete_all), null: false
      add :sequence_id, :integer, null: false
    end

    create index(:child_listings, [:parent_id, :sequence_id], unique: true)
    create index(:child_listings, [:listing_id], unique: true)

    create table(:global_handles, primary_key: false) do
      add :listing_id, references(:listings, on_delete: :delete_all), null: false
      add :handle, :string, primary_key: true
    end

    create index(:global_handles, [:listing_id], unique: true)
  end
end
