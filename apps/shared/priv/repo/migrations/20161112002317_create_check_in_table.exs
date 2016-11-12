defmodule Shared.Repo.Migrations.CreateCheckInTable do
  use Ecto.Migration

  def change do
    create table(:check_ins, primary_key: false) do
      add :user_id, references(:users, on_delete: :delete_all, type: :bigserial), primary_key: true
      add :listing_id, references(:listings, on_delete: :delete_all, type: :bigserial), primary_key: true
      add :geom, :geometry
      add :inserted_at, :utc_datetime
    end
  end
end
