defmodule Badslava.Scraper do
  import Ecto.Query, only: [from: 2]
  import Scraper.Helpers
  alias Scraper.Helpers
  alias Shared.Scrapings
  alias Shared.Repo

  def run do
    IO.puts "Retrieving latest Badslava listings..."
    badslava_listings = retrieve_latest_listings()
    IO.puts "Retrieved #{Enum.count(badslava_listings)} new listings..."
    IO.puts "Converting listings to native format..."
    converted = convert(badslava_listings)
    IO.puts "Converted #{Enum.count(converted)} listings..."
    retrieved = for r <- retrieve_from_store(), do: decode_time(r)
    IO.puts "Retrieved #{Enum.count(retrieved)} stored listings..."
    IO.puts "Determining diff..."
    {add, remove, update} = diff(converted, retrieved)
    IO.puts "Adding #{Enum.count(added)}, removing #{Enum.count(removed)} listings..."
    IO.puts "Requesting listings update..."
    IO.puts "Storing latest badslava listings..."
    #store(Enum.map(badslava_listings, fn x -> encode_time(x) end))

  end

  defp diff(new, old) do
    new_hash = Enum.map(new, & hash(&1))
    old_hash = Enum.map(old, & hash(&1))
    new_map = Enum.zip(new_hash, new) |> Enum.into(%{})
    old_map = Enum.zip(old_hash, old) |> Enum.into(%{})
    new_mapset = MapSet.new(new_hash)
    old_mapset = MapSet.new(old_hash)
    added_hashes = MapSet.difference(new_mapset, old_mapset)
    removed_hashes = MapSet.difference(old_mapset, new_mapset)
    same_hashes = MapSet.intersection(old_mapset, new_mapset)

    add = MapSet.to_list(added_hashes) |> Enum.map(fn x -> new_map[x] end)
    remove = MapSet.to_list(removed_hashes) |> Enum.map(fn x -> old_map[x] end)
    update = MapSet.to_list(same_hashes) 
      |> Enum.filter(fn x => has_updates?(old_map[x], new_map[x]) end)
      |> Enum.map(fn x => new_map[x])

    {add, remove, update}
    # {nil, nil}
  end

  defp has_updates?(old, new) do
    old.when.start_time != new.when.start_time
      or old.notes != new.notes
      or old.email != new.email
      or old.email_name != new.email_name
      or old.cost != new.cost
  end

  defp hash(listing) do
    "#{listing.title}/#{listing.where.name}/#{listing.when.frequency}/#{listing.when.on}/#{Time.to_iso8601(listing.when.start_time)}"
  end

  defp retrieve_from_store() do
    Repo.all(
      from s in Scrapings, 
      where: s.source == "badslava",
      select: s.listing
    )
  end

  defp store(listings) do
    Repo.delete_all(from s in Scrapings, where: true)
    for l <- listings do
      cs = Scrapings.changeset(%Scrapings{}, %{
        "listing" => Map.from_struct(encode_time(l)),
        "source" => "badslava"
      })
      
      Repo.insert!(cs)
    end
  end

  defp convert(listings) do
    converted = for l <- listings do
      %{
        type: "badslava",
        visibility: "public",
        title: l.title,
        event_types: ["show", "open-mic"],
        categories: ["comedy"],
        where: %{
          name: l.venue_name,
          street: l.street,
          city: l.city,
          state_abbr: l.state_abbr,
          lng_lat: %{
            lng: l.lng,
            lat: l.lat
          }
        },
        when: %{
          frequency: l.frequency,
          on: l.week_day,
          start_time: l.start_time
        } 
      }
    end
    
    converted
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
          {_, _, [title]},
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

        notes = case alert_match do
          [{_, [_, {"onclick", alert}], _}] -> 
            captures = Regex.named_captures(~r/^alert\('(?<notes>.*)'\).*$/, alert)
            Map.get(captures, "notes")
          [] -> nil
        end

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


        out = %Shared.Model.Scraper.BadslavaListing{
          week_day: week_day,
          day: day,
          month: month, 
          year: year,
          start_time: convert_to_time(time),
          end_time: nil,
          title: title,
          venue_name: venue_name,
          street: street,
          city: city,
          state_abbr: state_abbr,
          frequency: frequency,
          cost: cost,
          phone: phone,
          lng: lng,
          lat: lat,
          email: elem(email, 0),
          email_name: elem(email, 1),
          website: website,
          notes: notes
        }


        #out = %{out | notes: notes, email: email} #website: website}
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