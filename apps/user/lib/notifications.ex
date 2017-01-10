defmodule User.Notifications do
  use GenServer

  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  alias Shared.NotificationItem
  alias Shared.Notification

  def start_link(notification_registry, user) do
    GenServer.start_link(__MODULE__, {:ok, notification_registry, user}, [])
  end

  def init({:ok, n_reg, user}) do
    {:ok, notifications} = Notification.Registry.subscribe(n_reg, user)
    {:ok, %{
      user: user,
      notification_registry: n_reg,
      notifications: notifications
    }}
  end
end