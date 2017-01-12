defmodule User.IndividualsManager do
  use Supervisor

  import Ecto.Query, only: [from: 2]

  def start_link(name, notification_registry, listing_registry) do
    {:ok, pid} = server = Supervisor.start_link(__MODULE__, {:ok, notification_registry, listing_registry}, name: name)
    # query = from s in Shared.User,
    #     where: s.type != "root",
    #     select: s
    # users = Shared.Repo.all(query)
    # #IO.inspect {:iterate_users, users}
    # Enum.each(users, fn u -> start_user(pid, u) end)
    # server
  end

  def start_user(server, %{type: "individual"} = user) do
    #IO.inspect {:start_user, user}
    Supervisor.start_child(server, [user])
  end

  def init({:ok, notification_registry, listing_registry}) do 
    children = [
      supervisor(User.Individual.Supervisor, [notification_registry, listing_registry], restart: :transient),
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end