defmodule Listing.GenerateRecurring do
  require Logger
  use GenServer
  import Ecto.Query, only: [from: 2]
  import Ecto.Changeset, only: [apply_changes: 1]

  alias Shared.Repo
  alias Shared.Listing, as: ListingTable
  alias Shared.Model.Recurring, as: WhenRecurring
  #alias Shared.Model.Listing.When.Once, as: WhenOnce
  alias Shared.Model.Listing.Where.Badslava, as: WhereBadslava

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
    Process.send_after(self(), :work, 5 * 1000)
  end

  defp work() do
    Logger.info "Refreshing recurrences..."

    results = Repo.all(from l in ListingTable, where: l.type == "recurring")
    # Convert where to Shared.Model.Recurring
    results
    |> Enum.map(fn x -> {x.when, x.where, x.name} end)
    |> Enum.map(fn {when_info, where_info, name} -> 
        when_cs = WhenRecurring.changeset(%WhenRecurring{}, when_info)
        where_cs = WhereBadslava.changeset(%WhereBadslava{}, where_info)
        tz = apply_changes(where_cs).lng_lat.timezone
        {apply_changes(when_cs), tz, name}
      end)
    |> Enum.map(fn {recurrable, tz, name} ->
        start_datetime = Calendar.DateTime.to_naive(Calendar.DateTime.now!(tz))
        #start_datetime = recurrable.rrule.dtstart
        end_datetime = Calendar.NaiveDateTime.add!(start_datetime, 90*24*60*60)
        case recurrable.rrule.dtstart do
          nil -> 
            IO.inspect name
          _ -> nil
        end
        # IO.inspect recurrable.rrule.dtstart
        # IO.inspect start_datetime
        # IO.inspect end_datetime
        recurrences = WhenRecurring.between(recurrable, start_datetime, end_datetime, tz) |> Enum.map(fn x -> 
          {:ok, x_out} = Calendar.DateTime.from_naive(x, tz) 
          x_out
        end)
        # IO.inspect recurrences
      end)
    
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