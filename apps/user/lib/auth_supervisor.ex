defmodule User.Auth.Supervisor do
  use Supervisor

  def start_link(name, listing_registry) do
    Supervisor.start_link(__MODULE__, {:ok, listing_registry}, name: name)
  end

  def start_user(server, user) do
    Supervisor.start_child(server, [user])
  end

  def init({:ok, listing_registry}) do 
    children = [
      worker(User.Auth, [listing_registry], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end