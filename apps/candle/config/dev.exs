use Mix.Config

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we use it
# with brunch.io to recompile .js and .css sources.
config :candle, Candle.Endpoint,
  http: [port: 4000],
  debug_errors: true,
  code_reloader: true,
  check_origin: false,
  watchers: [exit_on_eof: [
    "npm run watch", 
    cd: Path.expand("../", __DIR__)
  ]]

# Watch static and templates for browser reloading.
config :candle, Candle.Endpoint,
  live_reload: [
    patterns: [
      ~r{priv/static/.*(html|js|css|png|jpeg|jpg|gif|svg)$},
      ~r{priv/gettext/.*(po)$},
      ~r{web/views/.*(ex)$},
      ~r{web/templates/.*(eex)$}
    ]
  ]

# Do not include metadata nor timestamps in development logs
# config :logger, :console,
#   format: "[$level] $message\n",
#   level: :debug



# Set a higher stacktrace during development.
# Do not configure such in production as keeping
# and calculating stacktraces is usually expensive.
config :phoenix, :stacktrace_depth, 20

# Configure your database
# config :candle, Candle.Repo,
#   adapter: Ecto.Adapters.Postgres,
#   username: "postgres",
#   password: "postgres",
#   database: "candle_repo",
#   hostname: "localhost",
#   pool_size: 10
