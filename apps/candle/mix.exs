defmodule Candle.Mixfile do
  use Mix.Project

  def project do
    [app: :candle,
     version: "0.0.1",
     build_path: "../../_build",
     config_path: "../../config/config.exs",
     deps_path: "../../deps",
     lockfile: "../../mix.lock",
     elixir: "~> 1.4",
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
       :cowboy,
       :logger,
       :phoenix,
       :phoenix_html,
       :ueberauth,
       :ueberauth_facebook,
       :ueberauth_github,
       :ueberauth_identity,
       :ueberauth_twitter,
       :gettext,
       :shared,
       :notification,
       :auth,
       :user,
       :listing,
       :httpoison   
    ]]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "web", "test/support"]
  defp elixirc_paths(_),     do: ["lib", "web"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [{:phoenix, "~> 1.2.1"},
     {:phoenix_html, "~> 2.7"},
     {:phoenix_live_reload, "~> 1.0", only: :dev},
     {:gettext, "~> 0.9"},
     {:poison, "~> 2.2", override: true},
     {:cowboy, "~> 1.0"},
     {:ueberauth, "~> 0.4.0", override: true},
     {:ueberauth_github, "~> 0.4.0"},
     {:ueberauth_facebook, "~> 0.5.0"},
     {:ueberauth_twitter, "~> 0.2"},
     {:ueberauth_identity, "~> 0.2.3"},
     {:guardian, "~> 0.12.0"},
     {:ecto, "~> 2.1.0-rc", override: true},
     {:shared, in_umbrella: true},
     {:auth, in_umbrella: true},
     {:user, in_umbrella: true},
     {:httpoison, "~> 0.9.0"},
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
