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

  # def ensure_started(user) do
  #   name = via_tuple(user)

  #   case Registry.lookup(:notification_process_registry, user.id) do
  #     [] -> 
  #       IO.inspect {:not_started, user}
  #       User.IndividualsManager.start_user(User.IndividualsManager, user)
  #       IO.inspect {:stuff, Registry.lookup(:notification_process_registry, user.id)}
  #       name
  #     [head | tail] -> 
  #       IO.inspect {:already_started, user}
  #       name
  #   end
  # end

  defp via_tuple(user) do
    {:via, Registry, {:notification_process_registry, user.id}}
  end

  def init({:ok, user, notification_manager, notification_registry}) do
    #IO.inspect {:init_user_notifications_process, notification_manager}
    # {:ok, notifications} = Notification.Registry.subscribe(notification_registry, user)
    subscribe()
    {:ok, %{
      user: user,
      notification_manager: notification_manager, 
      notification_registry: notification_registry,
      notifications: []#notifications
    }}
  end

  def handle_info(:subscribe, %{user: user, notification_manager: notification_manager, notification_registry: notification_registry} = state) do
    #IO.inspect user, label: "Subscribing"
    Notification.Manager.add_user(user)
    {:ok, notifications} = out  = Notification.Manager.retrieve(notification_manager, user)
    IO.inspect {:retrieved_notifications, out}
    {:noreply, %{state | notifications: notifications}}
  end

  def handle_info({:notify, message}, %{user: user, notification_manager: notification_manager, notification_registry: notification_registry} = state) do
    IO.inspect message, label: "Received message"
    {:noreply, state}
  end

  def subscribe() do
    Process.send_after(self(), :subscribe, 1)
  end
end