defmodule Badslava.Scraper do
  alias Scraper.Helpers

  def run do
    badslava_listings = extract_latest_listings
    listings = convert(badslava_listings)
  end

  def convert(badslava_listings) do
    
  end

  def extract_latest_listings do
    html = retrieve
    venue_lnglat = extract_venue_lnglat(html)
    days = extract_days(html)
    dayTables = Enum.zip(days, Floki.find(html, "font + table"))
    badslava_listings = generate_badslava_listings(venue_lnglat, days, dayTables)

  end

  def generate_badslava_listings(venue_lnglat, days, dayTables) do
    Enum.map(dayTables, fn({
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
          {_, _, [frequency]},
          {_, _, [cost]},
          {_, _, alert_match}, #[{_, [_, {"onclick", alert}], _}]},
          {_, _, email_match}, #[{_, [_, {"href", email}], [email_name]}]},
          {_, _, website_match}, #[{_, [_, {"href", website}], _}]},
          {_, _, [phone]},
          _
      ]}]}) ->
        venue_name = Helpers.replace_apos(venue_name)
        lngLat = Map.get(venue_lnglat, venue_name)
        lng = elem(lngLat, 0)
        lat = elem(lngLat, 1)


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


        out = %Scraper.BadslavaListing{
          week_day: week_day,
          day: day,
          month: month, 
          year: year,
          start_time: time,
          name: name,
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
        IO.inspect out
        out
      end)
    end)
  end

  defp retrieve do
    resp = HTTPoison.get! "http://badslava.com/new-york-open-mics.php?sort=event_start_time"
    resp.body
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