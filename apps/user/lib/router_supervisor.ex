defmodule User.Router.Supervisor do
  use Supervisor

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do 
    children = [
      worker(User.Router, [[name: User.Router]], restart: :permanent)
    ]

    supervise(children, strategy: :one_for_one)
  end
end