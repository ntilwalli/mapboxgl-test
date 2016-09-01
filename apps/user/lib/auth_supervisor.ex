defmodule User.Auth.Supervisor do
  use Supervisor

  @name User.Auth.Supervisor

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, :ok, [name: @name])
  end

  def start_user(user) do
    Supervisor.start_child(@name, [[user: user], []])
  end

  def init(:ok) do 
    children = [
      worker(User.Auth, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end