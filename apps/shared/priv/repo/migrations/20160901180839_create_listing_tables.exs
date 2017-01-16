defmodule Shared.Repo.Migrations.CreateListingTables do
  use Ecto.Migration

  def change do
    create table(:listings, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :sort_id, :bigint, default: fragment("next_insta_id()")
      add :parent_id, references(:listings, on_delete: :delete_all, type: :bigint)
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :type, :string, null: false
      add :cuando, :map, null: false
      add :donde, :map, null: false
      add :meta, :map, null: false
      add :settings, :map, null: false
      add :release, :string, null: false
      add :visibility, :string, null: false
      add :source, :string
      add :handle, :string
      timestamps()
    end

    create index(:listings, [:type])
    create index(:listings, [:parent_id])
    create unique_index(:listings, [:handle])

    create table(:user_child_listings, primary_key: false) do
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial), primary_key: true
      add :user_id, references(:users, on_delete: :delete_all, type: :bigserial), null: false
      add :sequence_id, :integer, null: false
      add :handle, :string
    end

    create unique_index(:user_child_listings, [:listing_id])
    create unique_index(:user_child_listings, [:user_id, :sequence_id])
    create unique_index(:user_child_listings, [:user_id, :handle])

    create table(:group_child_listings, primary_key: false) do
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial), primary_key: true
      add :parent_id, references(:listings, on_delete: :delete_all, type: :bigserial), null: false
      add :sequence_id, :integer, null: false
      add :handle, :string
    end

    create unique_index(:group_child_listings, [:listing_id])
    create unique_index(:group_child_listings, [:parent_id, :sequence_id])
    create unique_index(:group_child_listings, [:parent_id, :handle])
    create unique_index(:group_child_listings, [:handle, :sequence_id])
  end
end
