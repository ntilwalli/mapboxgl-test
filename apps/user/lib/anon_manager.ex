defmodule User.AnonManager do
  use Supervisor

  def start_link(name, individuals_manager, listing_registry) do
    Supervisor.start_link(__MODULE__, {:ok, individuals_manager, listing_registry}, name: name)
  end

  def start_user(server, anonymous_id) do
    Supervisor.start_child(server, [anonymous_id])
  end

  def init({:ok, individuals_manager, listing_registry}) do 
    children = [
      worker(User.Anon, [individuals_manager, listing_registry], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end