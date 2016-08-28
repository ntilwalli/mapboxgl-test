defmodule Shared.Repo.Migrations.CreateExtensions do
  use Ecto.Migration

  def up do
    execute("CREATE EXTENSION citext;")
  end

  def down do
    execute("DROP EXTENSION citext;")
  end
end
