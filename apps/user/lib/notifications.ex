defmodule User.Notifications do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  alias Shared.NotificationItem
  alias Shared.Notification, as: SharedNotification
  alias Ecto.Multi


  def start_link(user, notification_manager, notification_registry) do
    #IO.inspect {:start_link_notifications, user}
    name = via_tuple(user)
    GenServer.start_link(__MODULE__, {:ok, user, notification_manager, notification_registry}, name: name)
  end

  def read(server, notification_ids) when is_list(notification_ids) do
    GenServer.cast(server, {:read, notification_ids})
  end

  defp via_tuple(user) do
    {:via, Registry, {:notification_process_registry, user.id}}
  end

  def init({:ok, user, notification_manager, notification_registry}) do
    Notification.Manager.add_user(user)
    {:ok, notifications} = out  = Notification.Manager.retrieve(notification_manager, user)
    {:ok, %{
      user: user,
      notification_manager: notification_manager, 
      notification_registry: notification_registry,
      notifications: notifications
    }}
  end

  def handle_cast({:read, notification_ids}, %{user: user, notification_manager: n_mgr, notifications: notifications} = state) do
    notifications = Notification.Manager.read(n_mgr, user, notification_ids)
    {:ok, %{state | notifications: notifications}}
  end

  def handle_info({:notify, message}, %{user: user, notification_manager: notification_manager, notification_registry: notification_registry} = state) do
    IO.inspect message, label: "Received message"
    {:noreply, state}
  end
end