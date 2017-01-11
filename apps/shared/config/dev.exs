use Mix.Config

# Configure your database
config :shared, Shared.Repo,
  adapter: Ecto.Adapters.Postgres,
  # username: "spotlight",
  # password: "",
  # database: "spotlight_repo",
  # hostname: "localhost",
  url: System.get_env("DEV_DATABASE_URL"),
  pool_size: 10,
  types: Shared.PostgresTypes