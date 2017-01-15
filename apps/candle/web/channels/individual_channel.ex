defmodule Candle.Notification.IndividualChannel do
  use Phoenix.Channel
  import Guardian.Phoenix.Socket
  require Logger

  @doc """
  Authorize socket to subscribe and broadcast events on this channel & topic

  Possible Return Values

  `{:ok, socket}` to authorize subscription for channel for requested topic

  `:ignore` to deny subscription/broadcast on this channel
  for the requested topic
  """
  def broadcast_notifications(user, notifications) do
    IO.inspect {:broadcast_notifications_args, user, notifications}
    Candle.Endpoint.broadcast("user:#{user.id}", "notifications", %{notifications: notifications})
  end


  def join("user:" <> user_id_string, message, socket) do
    {user_id, _} = Integer.parse(user_id_string)
    user = Guardian.Phoenix.Socket.current_resource(socket)

    if authorized?(user_id_string, socket) do
      Process.flag(:trap_exit, true)
      {:ok, notifications} = User.Individual.retrieve_notifications(user)
      IO.inspect {:joining, user_id_string, notifications}
      #:timer.send_interval(5000, :ping)
      #send(self(), {:after_join, message})
      {:ok, %{notifications: notifications}, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end


  def handle_info({:after_join, msg}, socket) do
    #broadcast! socket, "user:entered", %{user: msg["user"]}
    push socket, "notifications", %{status: "connected"}
    {:noreply, socket}
  end

  def handle_info(:ping, socket) do
    push socket, "notifications", %{user: "SYSTEM", body: "ping"}
    {:noreply, socket}
  end


  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  # It is also common to receive messages from the client and
  # broadcast to everyone in the current topic (toys:lobby).
  def handle_in("shout", payload, socket) do
    broadcast socket, "shout", payload
    {:noreply, socket}
  end

  # This is invoked every time a notification is being broadcast
  # to the client. The default implementation is just to push it
  # downstream but one could filter or change the event.
  def handle_out(event, payload, socket) do
    IO.inspect {:handle_out, event, payload}
    push socket, event, payload
    {:noreply, socket}
  end


  def terminate(reason, _socket) do
    Logger.debug "> leave #{inspect reason}"
    :ok
  end


  # Add authorization logic here as required.
  defp authorized?(user_id_string, socket) do
    {user_id, _} = Integer.parse(user_id_string)
    user = get_user(socket)
    #IO.inspect {:received_join, user_id, user}
    if user.id === user_id do
      true
    else
      false
    end
  end

  defp get_user(socket) do
    Guardian.Phoenix.Socket.current_resource(socket)
  end

end