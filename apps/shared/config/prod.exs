use Mix.Config

# Configure your database
config :shared, Shared.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: System.get_env("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  extensions: [
    {Geo.PostGIS.Extension, library: Geo},
    {Postgrex.Extensions.JSON, library: Poison}
  ]