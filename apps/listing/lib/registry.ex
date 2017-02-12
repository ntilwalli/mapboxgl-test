defmodule Listing.Registry do
  require Logger
  use GenServer
  import Ecto.Query, only: [from: 2]
  import Ecto.Changeset, only: [apply_changes: 1]
  

  def start_link(name, worker_supervisor, notification_manager) do
    GenServer.start_link(__MODULE__, {:ok, worker_supervisor, notification_manager}, name: name)
  end

  def lookup(server, listing_id) do
    GenServer.call(server, {:lookup, listing_id})
  end

  def create(server, listing, user) do
    #IO.inspect {:client_create_listing, listing}
    GenServer.call(server, {:create, listing, user})
  end

  def update(server, listing_id, listing, user) do
    #IO.puts "Updating #{listing_id}"
    #IO.inspect listing
    GenServer.call(server, {:update, listing_id, listing, user})
  end

  def delete(server, listing_id, user) do
    GenServer.call(server, {:delete, listing_id, user})
  end

  def init({:ok, worker_supervisor, notification_manager}) do
    Logger.debug "Initializing listing registry..."
    state = get_initial_state(worker_supervisor, notification_manager)
    {:ok, state}
  end

  def handle_call({:lookup, listing_id}, _, %{pids: pids, worker_supervisor: w_sup, notification_manager: n_mgr} = state) do
    case maybe_get_or_start(listing_id, state) do
      {:ok, pid} -> {:reply, {:ok, pid}, state}
      {:started, pid, new_state} -> {:reply, {:ok, pid}, new_state}
      {:error, _} = val -> {:reply, val, state}
    end
  end

  def handle_call({:create, listing, user}, _, %{worker_supervisor: w_super, notification_manager: n_mgr} = state) do
    listing = add_timezone(listing)
    {:ok, {pid, ref, listing}} = create_listing(listing, user, w_super, n_mgr)
    new_state = get_new_state_w_add(listing.id, {pid, ref}, state)

    object = listing.id
    verbs = ["create_listing"]
    subjects = [listing.user_id]

    Notification.Manager.notify(n_mgr, object, verbs, subjects, user)
    Listing.GenerateRecurring.generate(Listing.GenerateRecurring, user, listing)

    {:reply, {:ok, listing}, new_state}
  end

  def handle_call({:update, listing_id, listing, user}, _, state) do
    listing = add_timezone(listing)
    case maybe_get_or_start(listing_id, state) do
      {:ok, pid} -> {:reply, Listing.Worker.update(pid, listing, user), state}
      {:started, pid, new_state} -> {:reply, Listing.Worker.update(pid, listing, user), new_state}
      {:error, _} = val -> val
    end
  end

  def handle_call({:delete, listing_id, user}, _, state) do
    case maybe_get_or_start(listing_id, state) do
      {:ok, pid} -> {:reply, Listing.Worker.delete(pid, user), state}
      {:started, pid, new_state} -> {:reply, Listing.Worker.delete(pid, user), new_state}
      {:error, _} = val -> val
      foo -> 
        IO.inspect {:foo, foo}
        {:reply, {:error, "maybe_get_or_start in delete, Should not get here..."}, state}
    end
  end

  def handle_call({:bulk, _create, _delete, _update}, _, state) do
    {:reply, "got bulk", state}
  end

  def handle_info({:DOWN, ref, :process, _pid, reason}, %{pids: pids, refs: refs, worker_supervisor: w_sup, notification_manager: n_mgr} = state) do
    case reason do
      :normal -> 
        {listing_id, new_refs} = Map.pop(refs, ref)
        new_pids = Map.delete(pids, listing_id)
        {:noreply, %{state | pids: new_pids, refs: new_refs}}
      _ -> 
        {listing_id, refs} = Map.pop(refs, ref)
        new_pids = Map.delete(pids, listing_id)
        listing = Shared.Repo.one!(from l in Shared.Listing, where: l.id == ^listing_id)
        {pid, ref} = start_listing(listing, w_sup, n_mgr)
        out = %{state | pids: Map.put(pids, listing_id, pid), refs: Map.put(refs, ref, listing_id)}
        {:noreply, out}
    end
  end

  def handle_info({:test, pid, message}, state) do
    IO.inspect {:test, pid, message}
    Notification.Manager.notify(pid, message)
    {:noreply, state}
  end

  defp add_timezone(listing) do
    #IO.inspect {:add_timezone, listing}
    donde = listing["donde"]
    lng_lat = donde["lng_lat"]
    #IO.inspect {:donde, donde}
    #IO.inspect {:lng_lat, lng_lat}
    coords = {lng_lat["lng"], lng_lat["lat"]}
    #IO.inspect {:coords, coords}
    tz = Shared.TimezoneManager.get(coords)
    %{listing | "donde" => Map.put(donde, "lng_lat", Map.put(lng_lat, "timezone", tz))}
  end

  defp maybe_get_or_start(listing_id, %{pids: pids, worker_supervisor: w_sup, notification_manager: n_mgr} = state) do
    case Map.get(pids, listing_id) do
      nil -> 
        case Shared.Repo.get(Shared.Listing, listing_id) do
          nil -> {:error, "Listing with id #{listing_id} does not exist in database."}
          listing -> 
            {pid, _ref} = val = start_listing(listing, w_sup, n_mgr)
            new_state = get_new_state_w_add(listing.id, val, state)
            {:started, pid, new_state}
        end
      pid -> {:ok, pid}
    end
  end

  defp get_new_state_w_add(listing_id, {pid, ref}, %{pids: pids, refs: refs} = state) do
    new_refs = Map.put(refs, ref, listing_id)
    new_pids = Map.put(pids, listing_id, pid)
    %{state | pids: new_pids, refs: new_refs}
  end

  defp get_initial_state(worker_supervisor, notification_manager) do
    listings = Shared.Repo.all(from l in Shared.Listing, where: is_nil(l.parent_id))
    init_acc = %{pids: %{}, refs: %{}, worker_supervisor: worker_supervisor, notification_manager: notification_manager}
    out =
      listings |> Enum.reduce(init_acc, fn (listing, acc) -> 
        info = start_listing(listing, worker_supervisor, notification_manager)
        get_new_state_w_add(listing.id, info, acc)
      end)
    out
  end

  defp create_listing(listing, user, w_sup, n_mgr) do
    #IO.inspect {:create_listing, listing}
    {:ok, listing} = Shared.Manager.ListingManager.add(listing, user)
    {pid, ref} = start_listing(listing, w_sup, n_mgr)
    {:ok, {pid, ref, listing}}
  end

  defp start_listing(listing, w_sup, n_mgr) do
    {:registered_name, self_name} = Process.info self, :registered_name
    {:ok, pid} = Listing.Worker.Supervisor.start_worker(w_sup, listing, self_name, n_mgr)
    ref = Process.monitor(pid)
    {pid, ref}
  end

  # defp test() do
  #   cs = Shared.NotificationItem.changeset(%Shared.NotificationItem{}, %{
  #     object: 12,
  #     verbs: ["update_listing_name", "update_listing_start"],
  #     subjects: [39],
  #     user_id: 39
  #   })

  #   Process.send_after(self(), {:test, Notification.Manager, apply_changes(cs)}, 5000)
  # end

  # def handle_call({:start, %{id: listing_id} = listing}, _, {pids, refs}) do
  #   case Map.get(pids, listing_id) do
  #     nil ->
  #       case start_listing(listing) do
  #         {_pid, _ref} = val ->
  #           new_state = get_new_state_w_add(val, state)
  #           {:reply, :ok, new_state}
  #         _ ->
  #           {:reply, {:error, "Could not start listing"}, state}
  #       end
  #     _ -> {:reply, {:ok, "Listing already started"}, state}
  #   end
  # end

  # defp delete(listing_id, state) when is_number(listing_id) do
  #   {from_listing_id, _} = state
  #   query = from l in Listing,
  #     where: l.parent_id == ^listing_id
  #   results = Repo.all(query) 
  #   Enum.map(results, fn l -> delete(l.id, state) end)
  #   Listing.Worker.Supervisor.stop_worker(from_listing_id[listing_id], :remove)
  # end

  # defp get_initial_state do
  #   listings = Shared.Repo.all(from l in Shared.Listing, where: is_nil(l.parent_id))
  #   init_acc = %{
  #     from_listing_id: %{}
  #     refs: %{}
  #   }
  #   out =
  #     listings |> Enum.reduce(init_acc, fn (x, acc) -> 
  #       %{refs: acc_refs, from_listing_id: acc_fli} = acc
  #       %{refs: listing_tli, from_listing_id: listing_fli} = start_listing(x)
  #       %{init_acc | refs: Map.merge(listing_refs, acc_refs), from_listing_id: Map.merge(listing_fli, acc_fli)}
  #     end)
  #   out
  # end

  # defp start_listing(listing) do
  #   listing_id = listing.id
  #   pid = Listing.Worker.Supervisor.start_worker(listing)
  #   ref = Process.monitor(pid)
  #   from_listing_id = %{listing_id => pid}
  #   refs = %{ref => listing_id}
  #   init_acc = %{
  #     from_listing_id: from_listing_id,
  #     refs: refs
  #   }
  #   children = Shared.Repo.all(from l in Shared.Listing, where: l.parent_id == ^listing_id))
  #   children
  #   out =
  #     children |> Enum.reduce(init_acc, fn (x, acc) -> 
  #       %{refs: acc_refs, from_listing_id: acc_fli} = acc
  #       %{refs: listing_refs, from_listing_id: listing_fli} = start_listing(x)
  #       %{init_acc | refs: Map.merge(listing_refs, acc_refs), from_listing_id: Map.merge(listing_fli, acc_fli)}
  #     end)

  #   out
  # end

  # def remove_listing(listing_id) do
  #   pid = from_listing_id[listing_id]
  #   case Listing.Worker.Supervisor.stop_worker(pid) do
  #     :ok -> Listing.Worker.Supervisor.stop_
  #   end
  # end


  # def remove_listing(%Listing{} = listing, %{from_listing_id: fli}) do
  #   stop_status = Listing.Worker.Supervisor.stop_worker(from_listing_id[listing.id])
  #   case stop_status do
  #     :ok -> 

  #       Repo.delete(listing)
  #     val -> val
  #   end
  # end

  # defp remove_listing(listing) do
  #   listing_id = listing.id
  #   pid = Listing.Worker.Supervisor.start_worker(listing)
  #   to_listing_id = %{pid => listing_id}
  #   from_listing_id = %{listing_id => pid}
  #   init_acc = {to_listing_id, from_listing_id}
  #   children = Shared.Repo.all(from l in Shared.Listing, where: l.parent_id == ^listing_id))
  #   children
  #   {to_listing_id, from_listing_id} = out =
  #     children |> Enum.reduce(init_acc, fn (x, acc) -> 
  #       {acc_tli, acc_fli} = acc
  #       {tli, fli} = start_listing(x)
  #       {Map.merge(tli, acc_tli), Map.merge(fli, acc_fli)}
  #     end)

  #   out
  # end

end