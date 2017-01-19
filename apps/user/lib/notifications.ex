defmodule User.Notifications do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  alias Shared.NotificationItem
  alias Shared.Notification, as: SharedNotification
  alias Ecto.Multi


  def start_link(user, notification_manager, notification_registry) do
    GenServer.start_link(__MODULE__, {:ok, user, notification_manager, notification_registry})
  end

  def read(user, notification_ids) when is_list(notification_ids) do
    GenServer.cast(get_pid(user), {:read, notification_ids})
  end

  def retrieve(user) do
    GenServer.call(get_pid(user), :retrieve)
  end

  defp get_pid(user) do
    [{pid, _}] = Registry.lookup(:notification_process_registry, user.id)
    pid
  end

  def init({:ok, user, notification_manager, notification_registry}) do
    Registry.register(:notification_process_registry, user.id, user)
    Registry.register(:notification_process_registry, user.username, user)

    Notification.Manager.add_user(user)
    {:ok, notifications} = out  = Notification.Manager.retrieve(notification_manager, user)
    IO.inspect {:init_broadcast_notifications, notifications}
    schedule_init_broadcast()
    #Candle.Notification.IndividualChannel.broadcast_notifications(user, notifications)
    {:ok, %{
      user: user,
      notification_manager: notification_manager, 
      notification_registry: notification_registry,
      notifications: notifications
    }}
  end

  def handle_cast({:read, notification_ids}, %{user: user, notification_manager: n_mgr, notifications: notifications} = state) do
    notifications = Notification.Manager.read(n_mgr, user, notification_ids)
    Candle.Notification.IndividualChannel.broadcast_notifications(user, notifications)
    {:noreply, %{state | notifications: notifications}}
  end

  def handle_call(:retrieve, _from, %{notifications: notifications} = state) do
    {:reply, {:ok, notifications}, state}
  end


  def handle_info({:notify, message}, %{user: user, notification_manager: notification_manager, notification_registry: notification_registry} = state) do
    IO.inspect message, label: "Received message"
    {:noreply, state}
  end

  def handle_info(:broadcast, %{user: user, notifications: notifications} = state) do
    Candle.Notification.IndividualChannel.broadcast_notifications(user, notifications)
    {:noreply, state}
  end


  defp schedule_init_broadcast() do
    Process.send_after(self(), :broadcast, 1000) 
  end
end