defmodule Listing.GenerateRecurring do
  require Logger
  use GenServer
  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Ecto.Changeset, only: [apply_changes: 1]
  import Shared.Model.Decoders

  alias Shared.Repo
  alias Shared.Listing, as: ListingTable
  alias Shared.Model.Recurring, as: WhenRecurring
  #alias Shared.Model.Listing.When.Once, as: WhenOnce
  alias Shared.Model.Listing.Donde.Badslava, as: WhereBadslava

  def start_link(registry_name, opts \\ []) do
    GenServer.start_link(__MODULE__, {:ok, registry_name}, opts)
  end

  def init({:ok, registry_name}) do
    Logger.info "Starting recurrence worker..."
    work(registry_name)
    schedule_work()
    {:ok, registry_name}
  end

  def handle_info(:work, registry_name = state) do
    work(registry_name)
    schedule_work()
    {:noreply, state}
  end

  def schedule_work() do
    Process.send_after(self(), :work, 24 * 60 * 60 * 1000)
  end

  defp work(registry_name) do
    Logger.info "Refreshing recurrences..."
    user = Shared.Repo.get!(Shared.User, 0)
    results = Repo.all(from l in ListingTable, where: l.type == "recurring")


    results
    |> Enum.map(fn listing -> 
        recurrable = decode_cuando(listing.type, listing.cuando)
        donde = decode_donde(listing.donde)
        tz = donde.lng_lat.timezone
        {recurrable, tz, listing}
      end)
    |> Enum.map(fn {recurrable, tz, listing} ->
        start_of_today = get_start_of_today(tz)
        start_of_today_naive = Calendar.DateTime.to_naive(start_of_today)
        end_datetime = Calendar.NaiveDateTime.add!(start_of_today_naive, 90*24*60*60)
        recurrences_utc = WhenRecurring.between(recurrable, start_of_today, end_datetime, tz) |> Enum.map(fn x -> 
          {:ok, with_tz} = Calendar.DateTime.from_naive(x, tz)
          {:ok, with_utc} = Calendar.DateTime.shift_zone(with_tz, "Etc/UTC") 
          with_utc
        end)
        {recurrences_utc, listing, tz}
      end)
    |> Enum.map(fn {recurrences_utc, listing, tz} -> 
        start_of_today = get_start_of_today(tz)
        listing_id = listing.id
        today_8601 = DateTime.to_iso8601(start_of_today)

        q =
          from l in ListingTable, 
          where: l.type == "single" and 
            l.parent_id == ^listing_id and 
            fragment("(?->>'begins')::timestamptz AT TIME ZONE ? > ?::timestamptz AT TIME ZONE ?", l.cuando, ^"UTC", type(^today_8601, :utc_datetime), ^"UTC"),
          select: l.cuando

        children_cuando = Repo.all(q)

        donde = decode_donde(listing.donde)
        timezone = donde.lng_lat.timezone
        children_date_time_utc = for r <- children_cuando, do: decode_cuando("single", r).begins
        recurrences_8601 = for r <- recurrences_utc, do: Calendar.DateTime.Format.iso8601_basic(r)
        children_date_time_8601 = for r <- children_date_time_utc, do: Calendar.DateTime.Format.iso8601_basic(r)
        calculated = MapSet.new(recurrences_8601)
        already_existing = MapSet.new(children_date_time_8601)
        to_be_added = MapSet.difference(calculated, already_existing) |> Enum.to_list
        if Enum.count(to_be_added) > 0 do
          IO.puts "recurrences_8601"
          IO.inspect recurrences_8601
          IO.puts "children_date_time_8601"
          IO.inspect children_date_time_8601
          IO.puts "to_be_added"
          IO.inspect to_be_added
        end
        results = to_be_added |> Enum.map(fn x -> 
            {:ok, pid} = Listing.Registry.lookup(registry_name, listing.id)
            {:ok, dt}= Calendar.DateTime.Parse.rfc3339_utc(x)
            single = generate_single(listing, dt)
            {:ok, listing} = out = Listing.Worker.add_child(pid, single, user)
            out
          end)
      end)
  end

  defp generate_single(template, dt_tz) do
    begins = dt_tz
    cuando = decode_cuando(template.type, template.cuando)
    # IO.inspect template
    single_cuando = case cuando.duration do
      nil -> %{begins: begins}
      val -> %{begins: begins, ends: Calendar.DateTime.add!(begins, round(val*60.0))}
    end

    out = %{
      parent_id: template.id,
      type: "single",
      visibility: template.visibility,
      release: template.release,
      name: template.name,
      event_types: template.event_types,
      categories: template.categories,
      donde: template.donde,
      cuando: single_cuando,
      meta: template.meta,
      source: template.source
    }
  end

  defp get_start_of_today(tz) do
    start_datetime = Calendar.DateTime.to_naive(Calendar.DateTime.now!(tz))
    {:ok, start_of_day_naive} = NaiveDateTime.new(
      start_datetime.year, 
      start_datetime.month, 
      start_datetime.day, 
      0, 0, 0
    )

    {:ok, start_of_today} = Calendar.DateTime.from_naive(start_of_day_naive, tz)
    start_of_today
  end
end