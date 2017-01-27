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

#Configures Elixir's Logger
# config :logger, 
#   backends: [:console],
#   format: "$time $metadata[$level] $message\n",
#   metadata: [:request_id],
#   level: :debug


config :guardian, Guardian,
  issuer: "Auth.#{Mix.env}",
  ttl: {30, :days},
  verify_issuer: true,
  serializer: Auth.GuardianSerializer,
  secret_key: to_string(Mix.env),
  permissions: %{
    default: [
      :read_profile,
      :write_profile,
      :read_token,
      :revoke_token,
    ],
  }

config :ueberauth, Ueberauth,
  providers: [
    github: {Ueberauth.Strategy.Github, [uid_field: "login"]},
    facebook: {Ueberauth.Strategy.Facebook, [profile_fields: "email, name"]},
    twitter: {Ueberauth.Strategy.Twitter, []},
    identity: {Ueberauth.Strategy.Identity, [callback_methods: ["POST"]]}
  ]

config :ueberauth, Ueberauth.Strategy.Github.OAuth,
  client_id: System.get_env("GITHUB_CLIENT_ID"),
  client_secret: System.get_env("GITHUB_CLIENT_SECRET")

config :ueberauth, Ueberauth.Strategy.Facebook.OAuth,
  client_id: System.get_env("FACEBOOK_CLIENT_ID"),
  client_secret: System.get_env("FACEBOOK_CLIENT_SECRET")

config :ueberauth, Ueberauth.Strategy.Twitter.OAuth,
  consumer_key: System.get_env("TWITTER_CONSUMER_KEY"),
  consumer_secret: System.get_env("TWITTER_CONSUMER_SECRET")


# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"

# Configure phoenix generators
config :phoenix, :generators,
  migration: true,
  binary_id: false

config :candle, ecto_repos: [Shared.Repo]

# In your config/config.exs file
config :candle, Candle.Mailer,
  adapter: Bamboo.SparkPostAdapter,
  server: "smtp.sparkpostmail.com",
  port: 587,
  username: System.get_env("SPARKPOST_USERNAME"),
  password: System.get_env("SPARKPOST_PASSWORD"),
  tls: :if_available, # can be `:always` or `:never`
  ssl: true,
  retries: 1

