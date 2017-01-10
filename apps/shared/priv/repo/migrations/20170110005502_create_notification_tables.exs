defmodule Shared.Repo.Migrations.CreateNotificationTables do
  use Ecto.Migration

  def change do
    create table(:notification_items, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :sort_id, :bigint, default: fragment("next_insta_id()")
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :behalf_of, references(:users, on_delete: :delete_all)
      add :object, :bigserial, null: false
      add :verb, :string, null: false
      add :subjects, :map, null: false
      add :data, :map
      timestamps
    end

    create table(:notifications, primary_key: false) do
      add :id, :bigserial, primary_key: true
      add :item_id, references(:notification_items, on_delete: :delete_all, type: :bigserial), null: false
      add :user_id, :bigserial, primary_key: true
      add :read_at, :utc_datetime
      timestamps
    end

    create index(:notifications, [:user_id])
    create index(:notifications, [:item_id])
  end
end
