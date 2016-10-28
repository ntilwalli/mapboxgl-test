defmodule Listing.GenerateRecurring do
  require Logger
  use GenServer
  import Ecto.Query, only: [from: 2]

  alias Shared.Listing, as: ListingTable
  alias Shared.Model.Listing.When.Once, as: WhenOnce

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do
    Logger.info "Starting recurrence worker..."
    schedule_work()
    {:ok, []}
  end

  def handle_info(:work, state) do
    work()
    schedule_work()
    {:noreply, state}
  end

  def schedule_work() do
    Process.send_after(self(), :work, 60 * 1000)
  end

  defp work() do
    Logger.info "Refreshing recurrences..."
    #results = Repo.all(from l in ListingTable, where: l.type == "badslava")
    # generate_expected = generate_listings()
    # results |> Enum.map(fn r ->
    #   parent_id = r.id
    #   results = Repo.all(from l in ListingTable, where: l.parent_id == ^parent_id, l.type == "single")
    #   start_dts = results |> Enum.map(fn child ->
    #     WhenOnce.changeset(%WhenOnce{}, child.when)
    #   end)
    # end)
  end
end