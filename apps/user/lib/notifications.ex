defmodule User.Notifications do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  alias Shared.NotificationItem
  alias Shared.Notification


  def start_link(user, notification_registry) do
    name = via_tuple(user)
    GenServer.start_link(__MODULE__, {:ok, user, notification_registry}, name: name)
  end

  def ensure_started(user) do
    name = via_tuple(user)
    case Registry.lookup(:notification_process_registry, user.id) do
      [] -> 
        User.IndividualsManager.start_user(user)
        name
      [head | tail] -> 
        name
    end
  end

  defp via_tuple(user) do
    {:via, Registry, {:notification_process_registry, user.id}}
  end

  def init({:ok, user, notification_registry}) do
    {:ok, notifications} = Notification.Registry.subscribe(notification_registry, user)
    {:ok, %{
      user: user,
      notifications: notifications
    }}
  end
end