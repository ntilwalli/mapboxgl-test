defmodule Listing.Registry do
  require Logger
  use GenServer
  import Ecto.Query, only: [from: 2]
  import Listing.Helpers

  def start_link(name) do
    GenServer.start_link(__MODULE__, :ok, name: name)
  end

  def lookup(server, listing_id) do
    GenServer.call(server, {:lookup, listing_id})
  end

  def add(server, listing) do
    GenServer.call(server, {:add, listing})
  end

  def init(:ok) do
    Logger.debug "Initializing listing registry..."
    {:ok, get_initial_state}
  end

  def handle_call({:lookup, listing_id}, _, {from_listing_id, _} = state) do
    {:reply, Map.fetch(from_listing_id, listing_id), state}
  end

  def handle_call({:start, %{id: id} = listing}, _, state) do
    from_listing_id = state.from_listing_id
    case Map.get(from_listing_id, id) do
      nil ->
        case start_listing(listing) do
          {pid, listing} ->
            tli = Map.put(state.to_listing_id, pid, id)
            fli = Map.put(from_listing_id, id, pid)
            new_state = %{state | to_listing_id: tli, from_listing_id: fli}
            {:reply, :ok, new_state}
          _ ->
            {:reply, {:error, "Could not start listing"}, state}
        end
      _ -> {:reply, {:error, "listing already started"}, state}
    end
  end

  def handle_call({:add, listing}, _, state) do
    from_listing_id = state.from_listing_id
    refs = state.refs
    case add_listing(listing) do
      {:ok, {pid, listing}} ->
        tli = Map.put(state.to_listing_id, pid, id)
        fli = Map.put(from_listing_id, id, pid)
        new_state = %{state | to_listing_id: tli, from_listing_id: fli}
        {:reply, {:ok, listing}, new_state}
      val ->
        {:reply, val, state}
    end
  end

  def handle_call({:remove, listing_id}, _, state) do
    remove(listing_id, state)
  end

  def handle_call({:bulk, _add, _remove, _update}, _, state) do
    {:reply, "got bulk", state}
  end

  def handle_info({:DOWN, ref, :process, _pid, reason}, {from_listing_id,refs}) do
    case reason do
      :normal -> 
        {listing_id, refs} = Map.pop(refs, ref)
        from_listing_id = Map.delete(from_listing_id, listing_id)
        {:noreply, {from_listing_id, refs}}
      :remove ->
        {listing_id, refs} = Map.pop(refs, ref)
        from_listing_id = Map.delete(from_listing_id, listing_id)
        listing = Shared.Repo.one!(from l in Shared.Listing, where: l.id == ^listing_id)
        Share.Manager.Listing.delete_one(listing)
        {:noreply, {from_listing_id, refs}}
      _ -> 
        {listing_id, refs} = Map.pop(refs, ref)
        from_listing_id = Map.delete(from_listing_id, listing_id)
        listing = Shared.Repo.one!(from l in Shared.Listing, where: l.id == ^listing_id)
        {pid, ref} = start_listing(listing)
        out = {Map.put(from_listing_id, listing_id, pid), Map.put(refs, ref, listing_id)}
        {:no_reply, out}
    end
  end

  defp get_initial_state do
    listings = Shared.Repo.all(from l in Shared.Listing, where: is_nil(l.parent_id))
    init_acc = {%{}, %{}}
    out =
      listings |> Enum.reduce(init_acc, fn (listing, acc) -> 
        listing_id = listing.id
        {refs, from_listing_id} = acc
        {:ok, pid} = Listing.Worker.Supervisor.start_worker(listing)
        ref = Process.monitor(pid)
        %{acc | refs: Map.put(refs, ref, listing_id), from_listing_id: Map.put(from_listing_id, listing_id, pid)}
      end)
    out
  end

  defp add_listing(listing) do
    {:ok, listing} = Shared.Manager.Listing.add(listing)
    {pid, ref} = start_listing(listing)
    {:ok, {pid, ref, listing}}
  end

  defp start_listing(listing) do
    {:ok, pid} = Listing.Worker.Supervisor.start_worker(listing)
    ref = Process.monitor(pid)
    {pid, ref}
  end

  defp remove(listing_id, state) when is_number(listing_id) do
    {from_listing_id, _} = state
    query = from l in Listing,
      where: l.parent_id == ^listing_id
    results = Repo.all(query) 
    Enum.map(results, fn l -> remove(l.id, state) end)
    Listing.Worker.Supervisor.stop_worker(from_listing_id[listing_id], :remove)
  end

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