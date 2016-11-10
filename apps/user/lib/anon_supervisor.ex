defmodule User.Anon.Supervisor do
  use Supervisor

  def start_link(name, listing_registry) do
    Supervisor.start_link(__MODULE__, {:ok, listing_registry}, name: name)
  end

  def start_user(server, anonymous_id) do
    Supervisor.start_child(server, [anonymous_id])
  end

  def init({:ok, listing_registry}) do 
    children = [
      worker(User.Anon, [listing_registry], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end