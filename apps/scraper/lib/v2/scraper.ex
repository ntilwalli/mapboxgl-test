defmodule Scraper.BadslavaScraper.V2 do
  require Logger
  import Ecto.Query, only: [from: 2]
  import Scraper.Helpers
  import Scraper.BadslavaScraper.V1.Helpers
  import Helpers.V2
  import Cuando
  import PerformerSignUp
  import PerformerCheckIn
  import PerformerCostStageTime
  import PeformerLimit
  import Categories
  import ListedHosts
  import ContactInfo
  alias Scraper.Helpers
  alias Shared.Scrapings
  alias Shared.Repo

  def run(opts \\ []) do
    Logger.info "Retrieving latest Badslava listings..."
    scraped_listings = retrieve_latest_listings()
    Logger.info "Retrieved #{Enum.count(scraped_listings)} listings from Badslava..."
    stored_listings = for l <- retrieve_from_store(), do: l
    Logger.info "Retrieved #{Enum.count(stored_listings)} listings from store..."
    Logger.info "Determining diff..."
    {create, update, delete} = diffed_events = diff(scraped_listings, stored_listings)
    Logger.info "Creating #{Enum.count(create)}, updating #{Enum.count(update)}, deleting #{Enum.count(delete)} listings..."
    
    #create |> Enum.map(&convert/1)
    
    {created, updated, deleted} = transmitted = transmit(diffed_events)
    #transmit(diffed_events)
    # IO.inspect transmitted
    # IO.puts "Storing latest badslava listings..."
    store(transmitted)
  end

  defp retrieve_from_store() do
    Repo.all(
      from s in Scrapings, 
      where: s.source == "badslava",
      select: {s.data, s.listing_id}
    ) |> Enum.map(fn {data, id} -> {%{data | "start_time" => elem(Time.from_iso8601(data["start_time"]), 1)}, id} end)
  end


  defp diff(new, old_tuples) do
    old = Enum.map(old_tuples, fn x -> elem(x, 0) end)
    old_ids = Enum.map(old_tuples, fn x -> elem(x, 1) end)
    new_hash = Enum.map(new, & hash(&1))
    old_hash = Enum.map(old, & hash(&1))
    old_id_map = old_hash |> Enum.zip(old_ids) |> Enum.into(%{})
    new_map = Enum.zip(new_hash, new) |> Enum.into(%{})
    old_map = Enum.zip(old_hash, old) |> Enum.into(%{})
    new_mapset = MapSet.new(new_hash)
    old_mapset = MapSet.new(old_hash)
    created_hashes = MapSet.difference(new_mapset, old_mapset)
    removed_hashes = MapSet.difference(old_mapset, new_mapset)
    same_hashes = MapSet.intersection(old_mapset, new_mapset)
    create = MapSet.to_list(created_hashes) |> Enum.map(fn x -> new_map[x] end)
    delete = MapSet.to_list(removed_hashes) |> Enum.map(fn x -> old_id_map[x] end)
    update = MapSet.to_list(same_hashes) 
      |> Enum.filter(fn x -> has_updates?(old_map[x], new_map[x]) end)
      |> Enum.map(fn x -> {old_id_map[x], new_map[x]} end)

    {create, update, delete}
    # {nil, nil}
  end

  defp has_updates?(old, new) do
    old["start_time"] != new["start_time"]
      or old["note"] != new["note"]
      or old["email"] != new["email"]
      or old["email_name"] != new["email_name"]
      or old["cost"] != new["cost"]
  end

  defp hash(listing) do
    start_time = listing["start_time"]
    "#{listing["name"]}/#{listing["venue_name"]}/#{listing["frequency"]}/#{listing["week_day"]}/#{Time.to_iso8601(start_time)}"
  end


  defp transmit({create, update, delete} = _info) do
    user = Shared.Repo.get(Shared.User, 0)
    
    created = Enum.map(create, fn x -> 
      converted = convert(x)
      {:ok, result} = info = Listing.Registry.create(Listing.Registry, converted, user) 
      #IO.inspect result

      {result.id, x}
    end)

    updated = Enum.map(update, fn x -> 
      #IO.inspect x
      {listing_id, data} = x
      {:ok, result} = Listing.Registry.update(Listing.Registry, listing_id, convert(data), user) 
      x
    end)

    deleted = Enum.map(delete, fn x ->
      val = Shared.Repo.delete!(%Shared.Scrapings{listing_id: x}) 
      :ok = Listing.Registry.delete(Listing.Registry, x, user) 
      x
    end)

    {created, updated, deleted}
  end

  defp store({created, updated, deleted}) do
    Logger.debug "Storing scraped data..."
    Logger.debug "Storing new listings..."
    created = Enum.map(created, fn x -> 
      {l_id, data} = x
      row_data = %{data: data, listing_id: l_id, source: "badslava"}
      cs = Shared.Scrapings.changeset(%Shared.Scrapings{}, row_data)
      info = Shared.Repo.insert!(cs) 
      #IO.inspect info
    end)
    Logger.debug "Storing updated listings..."
    updated = Enum.map(updated, fn x -> 
      #IO.inspect x
      {l_id, data} = x
      row_data = %{data: data, source: "badslava"}
      cs = Shared.Scrapings.changeset(%Shared.Scrapings{listing_id: l_id}, row_data)
      #IO.inspect row_data
      #IO.inspect cs
      result = Shared.Repo.update!(cs) 
    end)
  end

  defp convert(l) do
    {cost, stage_time} = get_performer_cost_stage_time(l)

    meta = %{
      type: "standard",
      name: l["name"],
      performer_sign_up: get_performer_sign_up(l),
      performer_check_in: get_performer_check_in(l),
      performer_cost: cost,
      stage_time: stage_time,
      performer_limit: get_performer_limit(l),
      note: l["note"],
      categories: get_categories(l),
      event_types: ["open_mic"],
      listed_hosts: get_listed_hosts(l),
      contact_info: get_contact_info(l)
    }

    out = %{
      type: "recurring",
      visibility: "public",
      release: "posted",
      donde: %{
        type: "badslava",
        name: l["venue_name"],
        street: l["street"],
        city: l["city"],
        state_abbr: l["state_abbr"],
        lng_lat: %{
          lng: l["lng"],
          lat: l["lat"]
        }
      },
      cuando: get_cuando(l),
      meta: meta,
      settings: %{
        check_in: %{
          begins: %{
            type: "minutes_before_event_start",
            data: %{
              minutes: 30
            }
          },
          ends: %{
            type: "event_end"
          },
          radius: 30
        }
      },
      source: "badslava"
    }

    IO.inspect out

    out
  end


  def retrieve_latest_listings do
    html = retrieve
    venue_lnglat = extract_venue_lnglat(html)
    days = extract_days(html)
    dayTables = Enum.zip(days, Floki.find(html, "font + table"))
    generate_badslava_listings(venue_lnglat, days, dayTables)
  end


  def generate_badslava_listings(venue_lnglat, _days, dayTables) do
    Enum.flat_map(dayTables, fn({
      %{"week_day" => week_day, "day" => day, "month" => month, "year" => year}, {_, _, [_ | bodies_tail]}}) -> 
        #IO.inspect week_day 

        Enum.map(bodies_tail, fn({_, _, [{_, _, [
          {_, _, [time]},
          {_, _, [name]},
          {_, _, [venue_name]},
          {_, _, [street]},
          {_, _, [city]},
          {_, _, [state_abbr]},
          _,
          {_, _, [frequency_match]},
          {_, _, [cost]},
          {_, _, alert_match}, #[{_, [_, {"onclick", alert}], _}]},
          {_, _, email_match}, #[{_, [_, {"href", email}], [email_name]}]},
          {_, _, website_match}, #[{_, [_, {"href", website}], _}]},
          {_, _, [phone]},
          _
      ]}]}) ->

        venue_name = Helpers.replace_apos(venue_name)
        lngLat = Map.get(venue_lnglat, venue_name)
        lng = String.to_float(elem(lngLat, 0))
        lat = String.to_float(elem(lngLat, 1))

        frequency = case frequency_match do
          {"font", _, [val]} -> val
          val -> val 
        end 

        note = case alert_match do
          [{_, [_, {"onclick", alert}], _}] -> 
            captures = Regex.named_captures(~r/^alert\('(?<note>.*)'\).*$/, alert)
            Map.get(captures, "note")
          [] -> nil
        end

      time_regexes = get_time_regex_patterns(:prepend, "mic at")
        |> Enum.concat(get_time_regex_patterns(:append, "start"))
        |> Enum.concat(get_time_regex_patterns(:prepend, "(?<!sign(-| )up) ?starts?( at)?"))
        |> Enum.concat(get_time_regex_patterns(:prepend, "start time:"))



        # time_regexes = [
        #   ~r/mic at (?<hour>\d)/i,
        #   ~r/(?<hour>\d) ?(?<meridiem>(a|p))\.?m\.? start/i,
        #   ~r/(?<!sign(-| )up) ?starts?( at)?(?<hour>\d) ?(?<meridiem>(a|p))\.?m\.?/i,
        #   ~r/(?<hour>\d):(?<minute>\d\d) ?(?<meridiem>(a|p))\.?m\.? start/i,
        #   ~r/(?<!sign(-| )up) ?starts? (at )?(?<hour>\d):(?<minute>\d\d) ?(?<meridiem>(a|p))\.?m\.?/i,
        #   ~r/start time: (?<hour>\d):(?<minute>\d\d) ?(?<meridiem>(a|p))\.?m\.?/i
        # ]

        time = parse_note_with_regexes(time_regexes, note, time, &convert_to_time_string/1)
          
        email = case email_match do
          [{_, [{"href", email}], [email_name]}] -> 
            captures = Regex.named_captures(~r/^mailto:(?<email>.*)$/, email)
            {Map.get(captures, "email"), email_name}
          _ -> {nil, nil}
        end

        website = case website_match do
          [{_, [{"href", website}], _}] -> website
          [] -> nil
        end

        n_year = "20#{year}"
        n_month = case String.length(month) do
          1 -> "0#{month}"
          _ -> month
        end

        n_day = case String.length(day) do
          1 -> "0#{day}"
          _ -> day
        end
        
        date_string = "#{n_year}-#{n_month}-#{n_day}"
        {:ok, date_val} = Date.from_iso8601(date_string)

        time_val = convert_to_time(time)

        out = %{
          "type" => "badslava",
          "week_day" => week_day,
          "date" => date_val,
          "start_time" => time_val,
          "name" => name,
          "venue_name" => venue_name,
          "street" => street,
          "city" => city,
          "state_abbr" => state_abbr,
          "frequency" => frequency,
          "cost" => cost,
          "phone" => phone,
          "lng" => lng,
          "lat" => lat,
          "email" => elem(email, 0),
          "email_name" => elem(email, 1),
          "website" => website,
          "note" => note
        }

        #IO.inspect out
        out
      end)
    end)
  end

  defp retrieve do
    resp = HTTPoison.get! "http://badslava.com/new-york-open-mics.php?sort=event_start_time"
    resp.body
  end

  defp encode_time(listing) do
    %{listing | start_time: Time.to_iso8601(listing.start_time)}
  end

  defp decode_time(listing) do
    %{listing | start_time: Time.from_iso8601(listing.start_time)}
  end

  def extract_venue_lnglat(html) do
    script = get_script_info(html)

    script_extractor = ~r/.*var venue_name = (?<venue_name>\[.*\]);.*var venue_latitude = (?<venue_latitude>\[.*\]);.*var venue_longitude = (?<venue_longitude>\[.*\]);.*/s
    matches = Regex.named_captures(script_extractor, script)
    event_info = Poison.decode!(Map.get(matches, "venue_name"))
    info_extractor= ~r/^(?<day>.*)<br><b>(?<name>.*)<\/b><br>(?<street>.*)<br>(?<city>.*).*, (?<stateAbbr>[A-Z][A-Z])(<br>)?(?<sign_up> sign-up )?(<br>)?((?<start_time>[0-9][0-9]?:[0-9][0-9])(?<ampm>[a|p]m) start ).*$/
    venue_names = Enum.map(event_info, fn(ev) -> 
      out = Regex.named_captures(info_extractor, ev) 
      Helpers.replace_apos(Map.get(out, "name")) 
    end)
    # IO.inspect(venue_names)
    lat_info = Poison.decode!(Map.get(matches, "venue_latitude"))
    # IO.inspect(lat_info)
    lng_info = Poison.decode!(Map.get(matches, "venue_longitude"))
    # IO.inspect(lng_info)

    lngLat = Enum.zip(lng_info, lat_info)
    Map.new(Enum.zip(venue_names, lngLat))
  end

  def get_script_info(html) do
    Floki.find(html, "script") 
      |> Enum.map(fn({_, _, body}) -> hd(body) end)
      |> Enum.filter(fn(body) -> String.length(body) > 2000 end)
      |> hd
  end

  def extract_days(html) do
    dayExtractor = ~r/(?<week_day>.*day) (?<month>\d{1,2})\/(?<day>\d{1,2})\/(?<year>\d{2})/
    Floki.find(html, "font")
      |> Enum.filter(fn({_, _, [val]}) -> Regex.match?(dayExtractor, val) end)
      |> Enum.map(fn({_, _, [val]}) -> Regex.named_captures(dayExtractor, val) end)
  end

end