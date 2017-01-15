defmodule User.Individual.Supervisor do
  use Supervisor



  def start_link(notification_manager, listing_registry, notification_registry, user) do
    #IO.inspect {:starting_individual_supervisor, user}
    #IO.inspect {:n_r, notification_registry}
    #IO.inspect {:l_r, listing_registry}
    out =  Supervisor.start_link(__MODULE__, {:ok, user, notification_manager, listing_registry, notification_registry})
    #IO.inspect out
    out
  end


  def init({:ok, user, notification_manager, listing_registry, notification_registry}) do
    #IO.inspect {:initing_individual_supervisor, user}
    
    children = [
      worker(User.Individual, [user, listing_registry]),
      worker(User.Notifications, [user, notification_manager, notification_registry])
    ]

    supervise(children, strategy: :one_for_one)
  end
end