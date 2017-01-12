defmodule Notification do
  use Application

  # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec, warn: false

    # Define workers and child supervisors to be supervised
    children = [
      supervisor(Registry, [:unique, Notification.Registry], id: Notification.Registry),
      worker(Notification.Manager, [Notification.Manager]),
    ]

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options

    Supervisor.start_link(children, strategy: :one_for_one)
  end
end
