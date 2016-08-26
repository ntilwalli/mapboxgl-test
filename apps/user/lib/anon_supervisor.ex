defmodule User.Anon.Supervisor do
  use Supervisor

  @name User.Anon.Supervisor

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, :ok, [name: @name])
  end

  def start_user do
    Supervisor.start_child(@name, [])
  end

  def init(:ok) do 
    children = [
      worker(User.Anon, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end