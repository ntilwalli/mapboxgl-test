defmodule User.Auth.Supervisor do
  use Supervisor

  def start_link(name) do
    Supervisor.start_link(__MODULE__, :ok, name: name)
  end

  def start_user(server, user) do
    Supervisor.start_child(server, [user])
  end

  def init(:ok) do 
    children = [
      worker(User.Auth, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end