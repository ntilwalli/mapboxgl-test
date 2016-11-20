defmodule Shared.Mixfile do
  use Mix.Project

  def project do
    [app: :shared,
     version: "0.1.0",
     build_path: "../../_build",
     config_path: "../../config/config.exs",
     deps_path: "../../deps",
     lockfile: "../../mix.lock",
     elixir: "~> 1.3",
     elixirc_paths: ["lib", "web"],
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps]
  end

  def application do
    [applications: [:logger, :postgrex, :ecto, :httpoison, :calendar],
     mod: {Shared, []}]
  end

  defp deps do
    [
      {:calendar, "~> 0.16.1"},
      #{:calecto, "~> 0.16.0"},
      {:postgrex, "~> 1.0.0-rc"},
      {:ecto, "~> 2.1.0-rc", override: true},
      {:geo, "~> 1.2", path: "../../custom_deps/geo", override: true},
      {:poison, "~> 2.2"},
      {:httpoison, "~> 0.9.0"},
      {:floki, "~> 0.10.1"}
    ]
  end
end
