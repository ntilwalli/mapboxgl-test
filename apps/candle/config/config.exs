# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# Configures the endpoint
config :candle, Candle.Endpoint,
  url: [host: "localhost"],
  root: Path.dirname(__DIR__),
  secret_key_base: "LBUX5riUgI2shoiUuHTuPrl/KpDtw9cqQVhoM4fQRJzTvt3WHGX2qrBn0XeTJlgI",
  render_errors: [accepts: ~w(html json)],
  pubsub: [name: Candle.PubSub,
           adapter: Phoenix.PubSub.PG2]


# Configure phoenix generators
config :phoenix, :generators,
  migration: true,
  binary_id: false

config :candle, ecto_repos: [Shared.Repo]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"


