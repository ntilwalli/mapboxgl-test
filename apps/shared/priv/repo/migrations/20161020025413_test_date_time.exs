defmodule Shared.Repo.Migrations.TestDateTime do
  use Ecto.Migration

  def change do
    create table(:test_date_time, primary_key: false) do
      add :flag, :string
      add :foo, :map
    end
  end
end
