defmodule Notification.Registry do
  def start_link(user_registry) do
    GenServer.start_link(__MODULE__, {:ok, user_registry}, [])
  end

  def subscribe(server, user) do
    GenServer.call(server, {:subscribe, user})
  end

  def unsubscribe(server, user) do
    GenServer.call(server, {:unsubscribe, user})
  end

  def notify(server, notification_item) do
    GenServer.call(server, {:notify, notification_item})
  end

  def init({:ok, user_registry}) do
    {:ok, %{user_registry: user_registry, subscribers: %{}}}
  end

  def handle_call({:subscribe, %Shared.User{} = user}, _from, %{subscribers: subscribers} = state) do
    case subscribers[user.id] do
      nil -> 
        {:reply, {:ok, retrieve(user)}, %{state | subscribers: Map.put(subscribers, user.id, true)}}
      _ ->
        {:reply, {:error, :already_subscribed}, state}
    end
  end

  def handle_call({:unsubscribe, %Shared.User{} = user}, _from, %{subscribers: subscribers} = state) do
    case subscribers[user.id] do
      nil -> 
        {:reply, {:error, :already_not_subscribed}, state}
      _ ->
        {:reply, :ok, %{state | subscribers: Map.delete(subscribers, user.id)}}
    end
  end


  def handle_call({:notify, %Shared.NotificationItem{} = notification_item}) do
    # persist notification

    # distribute to subscribers

  end

  defp retrieve(user) do
    []
  end

end