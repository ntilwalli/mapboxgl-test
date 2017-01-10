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
      supervisor(User.Anon.Supervisor, [User.Anon.Supervisor, Listing.Registry]),
      supervisor(User.Individual.Supervisor, [User.Individual.Supervisor, Listing.Registry]),
      worker(User.Registry, [User.Registry, User.Anon.Supervisor, User.Individual.Supervisor]),
    ]

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: User.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
