defmodule Auth.Mixfile do
  use Mix.Project

  def project do
    [
     app: :auth,
     version: "0.1.0",
     build_path: "../../_build",
     config_path: "../../config/config.exs",
     deps_path: "../../deps",
     lockfile: "../../mix.lock",
     elixir: "~> 1.4",
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps()
    ]
  end

  # Configuration for the OTP application
  #
  # Type "mix help compile.app" for more information
  def application do
    [
      applications: [
        :logger,
        :comeonin, 
        :shared,
        :oauth2,
        :oauth
      ],
      mod: {Auth, []}
    ]
  end

  # Dependencies can be Hex packages:
  #
  #   {:mydep, "~> 0.3.0"}
  #
  # Or git/path repositories:
  #
  #   {:mydep, git: "https://github.com/elixir-lang/mydep.git", tag: "0.1.0"}
  #
  # To depend on another app inside the umbrella:
  #
  #   {:myapp, in_umbrella: true}
  #
  # Type "mix help deps" for more examples and options
  defp deps do
    [
      {:shared, in_umbrella: true},
      #{:ueberauth, "~> 0.3.0"},
      {:guardian, "~> 0.12.0"},
      {:comeonin, "~> 2.4"},
      {:poison, "~> 2.2"},
      {:oauth, github: "tim/erlang-oauth"},
      {:oauth2, "== 0.6.0"},
      {:uuid, "~> 1.1"},
      {:calendar, "~> 0.16.1"},
    ]
  end
end
