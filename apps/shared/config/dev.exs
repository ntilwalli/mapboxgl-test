use Mix.Config

# Configure your database
config :shared, Shared.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "postgres",
  password: "postgres",
  database: "spotlight_repo",
  hostname: "localhost",
  pool_size: 10,
  extensions: [
    {Geo.PostGIS.Extension, library: Geo},
    {Postgrex.Extensions.JSON, library: Poison}
  ]