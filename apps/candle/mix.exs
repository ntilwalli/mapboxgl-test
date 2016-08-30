defmodule Candle.Mixfile do
  use Mix.Project

  def project do
    [app: :candle,
     version: "0.0.1",
     build_path: "../../_build",
     config_path: "../../config/config.exs",
     deps_path: "../../deps",
     lockfile: "../../mix.lock",
     elixir: "~> 1.3",
     elixirc_paths: elixirc_paths(Mix.env),
     compilers: [:phoenix, :gettext] ++ Mix.compilers,
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     aliases: aliases,
     deps: deps]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [mod: {Candle, []},
     applications: [
       :comeonin,
       :cowboy,
       :ecto,
       :logger,
       :oauth2,
       :oauth,
       :phoenix,
       :phoenix_ecto,
       :phoenix_html,
       :postgrex,
       :ueberauth,
       :ueberauth_facebook,
       :ueberauth_github,
       :ueberauth_identity,
       :ueberauth_twitter,
       :gettext,
       :shared,
       :auth,
       :user
    ]]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "web", "test/support"]
  defp elixirc_paths(_),     do: ["lib", "web"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [{:phoenix, "~> 1.2"},
     {:postgrex, ">= 0.11.2", override: true},
     {:phoenix_ecto, "~>3.0.0", override: true},
     {:phoenix_html, "~> 2.6"},
     {:phoenix_live_reload, "~> 1.0", only: :dev},
     {:gettext, "~> 0.9"},
     {:poison, "~> 2.2", override: true},
     {:cowboy, "~> 1.0"},
     {:oauth, github: "tim/erlang-oauth"},
     {:comeonin, "~> 2.4"},
     {:ueberauth, "~> 0.3.0", override: true},
     {:ueberauth_github, "~> 0.2.0"},
     {:ueberauth_facebook, "~> 0.3.2"},
     {:ueberauth_twitter, "~> 0.2"},
     {:ueberauth_identity, "~> 0.2.3"},
     {:guardian, "~> 0.12.0"},
     {:guardian_db, "~> 0.7.0"},
     {:oauth2, "== 0.6.0", override: true},
     {:shared, in_umbrella: true},
     {:auth, in_umbrella: true},
     {:user, in_umbrella: true}
   ]
  end

  # Aliases are shortcut or tasks specific to the current project.
  # For example, to create, migrate and run the seeds file at once:
  #
  #     $ mix ecto.setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    ["ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
     "ecto.reset": ["ecto.drop", "ecto.setup"]]
  end
end
