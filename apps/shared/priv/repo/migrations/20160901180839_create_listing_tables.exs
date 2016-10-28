defmodule Shared.Repo.Migrations.CreateListingTables do
  use Ecto.Migration

  def change do
    create table(:listings, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :sort_id, :bigint, default: fragment("next_insta_id()")
      add :parent_id, :bigint
      add :user_id, references(:users, on_delete: :delete_all, type: :bigserial), null: false
      add :type, :string, null: false
      add :name, :string
      add :event_types, {:array, :string}
      add :categories, {:array, :string}
      add :where, :map, null: false
      add :when, :map, null: false
      add :meta, :map, null: false
      add :release, :string, null: false
      add :visibility, :string, null: false
      add :source, :string
      add :handle, :string
      timestamps
    end

    create index(:listings, [:type])
    create index(:listings, [:parent_id])
    create unique_index(:listings, [:handle])

    create table(:user_listings, primary_key: false) do
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial), null: false
      add :user_id, references(:users, on_delete: :delete_all, type: :bigserial), primary_key: true
      add :sequence_id, :integer, primary_key: true
      add :handle, :string
    end

    create unique_index(:user_listings, [:listing_id])
    create unique_index(:user_listings, [:user_id, :handle])

    create table(:child_listings, primary_key: false) do
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial), null: false
      add :parent_id, references(:listings, on_delete: :delete_all, type: :bigserial), primary_key: true
      add :sequence_id, :integer, primary_key: true
      add :handle, :string
    end

    create unique_index(:child_listings, [:listing_id])
    create unique_index(:child_listings, [:parent_id, :handle])

  end
end
