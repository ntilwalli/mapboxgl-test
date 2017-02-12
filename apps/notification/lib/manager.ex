defmodule Notification.Manager do
  alias Ecto.Multi
  #import Ecto.Repo, only: [preload: 2]
  import Ecto.Query, only: [from: 2]
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Shared.Repo

  def start_link(name) do
    GenServer.start_link(__MODULE__, :ok, name: name)
  end

  def add_user(user) do
    Registry.register(Notification.Registry, user.id, user)
  end

  def remove_user(user) do
    Registry.unregister(Notification.Registry, user.id)
  end

  def retrieve(server, user) do
    GenServer.call(server, {:retrieve, user})
  end

  # def notify(server, notification_item) do
  #   GenServer.cast(server, {:notify, notification_item})
  # end

  def notify(server, object, actions, subjects, actor) do
    GenServer.cast(server, {:notify, object, actions, subjects, actor})
  end
  
  def read(server, user, notification_ids) do
    GenServer.cast(server, {:read, user, notification_ids})
  end

  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:retrieve, %Shared.User{} = user}, from, state) do
    IO.inspect user.username, label: "Register user for notifications"
    {:reply, {:ok, retrieve(user)}, state}
  end

  # def handle_cast({:notify, %Shared.NotificationItem{} = item}, state) do
  #   IO.inspect {:got_notification, item}
  #   # persist notification
  #   #out = Shared.Repo.insert(item)
  #   # IO.inspect {:insert_attempt, out}
  #   multi_query = Multi.new
  #     |> Multi.insert(:notification_item, item)
  #     |> Multi.run(
  #       :notifications, 
  #       fn changes_so_far -> 
  #         #IO.inspect {:changes_so_far, changes_so_far}
  #         %{notification_item: n_item} = changes_so_far
  #         item_id = n_item.id
  #         notifications = Enum.map(n_item.subjects, fn s -> 
  #           now = Calendar.DateTime.now_utc()
  #           %{
  #               item_id: item_id,
  #               user_id: s,
  #               inserted_at: now,
  #               updated_at: now
  #           }
  #         end)

  #         #IO.inspect {:notifications, notifications}
  #         {num_rows, rows} = out = Repo.insert_all(Shared.Notification, notifications, returning: true)
  #         #IO.inspect {:out, out}
  #         {:ok, rows}
  #       end 
  #     )

  #   {:ok, %{
  #     notification_item: notification_item, 
  #     notifications: notifications
  #   }} = Repo.transaction(multi_query)

  #   distribute(notifications)

  #   {:noreply, state}
  # end

  def handle_cast({:notify, object, actions, subjects, actor}, state) do
    cs = Shared.NotificationItem.changeset(%Shared.NotificationItem{}, %{
      object: object,
      actions: actions,
      subjects: subjects,
      user_id: actor.id
    })

    item = apply_changes(cs)
    # persist notification
    #out = Shared.Repo.insert(item)
    # IO.inspect {:insert_attempt, out}
    multi_query = Multi.new
      |> Multi.insert(:notification_item, item)
      |> Multi.run(
        :notifications, 
        fn changes_so_far -> 
          #IO.inspect {:changes_so_far, changes_so_far}
          %{notification_item: n_item} = changes_so_far
          item_id = n_item.id
          notifications = Enum.map(n_item.subjects, fn s -> 
            now = Calendar.DateTime.now_utc()
            %{
                item_id: item_id,
                user_id: s,
                inserted_at: now,
                updated_at: now
            }
          end)

          #IO.inspect {:notifications, notifications}
          {num_rows, rows} = out = Repo.insert_all(Shared.Notification, notifications, returning: true)
          #IO.inspect {:out, out}
          {:ok, rows}
        end 
      )

    {:ok, %{
      notification_item: notification_item, 
      notifications: notifications
    }} = Repo.transaction(multi_query)

    distribute(notifications)

    {:noreply, state}
  end

  def handle_call({:read, user, notification_ids}, from, state) do
    IO.inspect user.username, label: "Register user for notifications"
    now = Calendar.DateTime.now_utc()
    query = from(p in Shared.Notifications, where: p.id in ^notification_ids, update: [set: [read_at: ^now]])
    query |> Shared.Repo.update_all([])
    {:reply, {:ok, retrieve(user)}, state}
  end

  def handle_info({:distribute, user_id, message}, %{subscribers_refs: s_refs} = state) do
    Registry.dispatch(Notification.Registry, user_id, fn entries ->
      for {pid, _} <- entries, do: send(pid, {:notify, message})
    end)

    {:noreply, state}
  end


  defp retrieve(user) do
    now = Calendar.DateTime.now_utc()
    begins = now |> Calendar.DateTime.subtract!(round(30*24*60*60))

    query = from s in Shared.Notification,
        preload: :item,
        where: s.user_id == ^user.id and 
          s.inserted_at >= ^begins and 
          s.inserted_at <= ^now,
        select: s

    notifications = Repo.all(query)
    # distribute(notifications)
  end

  defp distribute(notifications) do
    Enum.map(notifications, fn n ->  
      n_with_item = Shared.Repo.preload(n, [:item])
      Registry.dispatch(Notification.Registry, n.user_id, fn entries ->
        for {pid, _} <- entries, do: send(pid, {:notify, n_with_item})
      end)
    end)
  end

  defp test(user_id, message) do
    Process.send_after(self(), {:distribute, user_id, message}, 10) 
  end
end