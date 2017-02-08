defmodule Listing do
  use Application

  # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec, warn: false

    # Define workers and child supervisors to be supervised
    children = [
      # Starts a worker by calling: Listing.Worker.start_link(arg1, arg2, arg3)
      supervisor(Listing.Worker.Supervisor, [Listing.Worker.Supervisor, Listing.GenerateRecurring]),
      worker(Listing.Registry, [Listing.Registry, Listing.Worker.Supervisor, Notification.Manager]),
      worker(Listing.GenerateRecurring, [Listing.GenerateRecurring, Listing.Registry])
    ]

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options
    Supervisor.start_link(children, strategy: :one_for_one)
  end
end
