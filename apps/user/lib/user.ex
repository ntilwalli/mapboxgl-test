defmodule User do
  use Application

  # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec, warn: false

    # Define workers and child supervisors to be supervised
    children = [
      # Starts a worker by calling: User.Worker.start_link(arg1, arg2, arg3)
      # worker(User.Worker, [arg1, arg2, arg3]),
      supervisor(Registry, [:unique, :individual_user_registry], id: :individual_user_registry),
      supervisor(Registry, [:unique, :notification_process_registry], id: :notification_process_registry),
      supervisor(Registry, [:unique, :anonymous_user_registry], id: :anonymous_user_registry),
      supervisor(User.AnonManager, [User.AnonManager, User.IndividualsManager, Listing.Registry]),
      supervisor(User.IndividualsManager, [User.IndividualsManager, Notification.Registry, Listing.Registry])
    ]

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: User.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
