defmodule Shared.Repo.Migrations.CreatePostgisExtension do
  use Ecto.Migration

  def up do
    execute("CREATE EXTENSION postgis;")
    # execute("CREATE EXTENSION postgis_sfcgal;")
    # execute("CREATE EXTENSION fuzzystrmatch;")
    # execute("CREATE EXTENSION address_standardizer;")
    # execute("CREATE EXTENSION address_standardizer_data_us;")
    # execute("CREATE EXTENSION postgis_tiger_geocoder;")
  end

  def down do
    # execute("DROP EXTENSION postgis_tiger_geocoder;")
    # execute("DROP EXTENSION address_standardizer_data_us;")
    # execute("DROP EXTENSION address_standardizer;")
    # execute("DROP EXTENSION fuzzystrmatch;")
    # execute("DROP EXTENSION postgis_sfcgal;")
    execute("DROP EXTENSION postgis;")
  end;
end
