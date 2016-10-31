defmodule User.Anon.Supervisor do
  use Supervisor

  def start_link(name) do
    Supervisor.start_link(__MODULE__, :ok, name: name)
  end

  def start_user(server, anonymous_id) do
    Supervisor.start_child(server, [anonymous_id])
  end

  def init(:ok) do 
    children = [
      worker(User.Anon, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end