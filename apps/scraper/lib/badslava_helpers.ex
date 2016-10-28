defmodule Scraper.BadslavaScraper.Helpers do
  def extract_meta(listing) do
    note = listing["note"]
    #if !is_nil(note) do
      #IO.puts note
    #end

    %{rrule: rrule, exdate: exdates} = when_info = extract_when_info(listing)
    #IO.inspect when_info, label: "when"
    sign_up_info = extract_sign_up_info(listing)
    #IO.inspect sign_up_info, label: "sign-up"

    #%{} = sign_up_info

    # ordering = Enum.flat_map(style, fn x -> 
    #   cond do
    #     x == :list and !!note ->
    #       if Regex.match?(~r/first come,? first (serve|perform|sign(-| )up)/i, note) do
    #         [x, :fcfs]
    #       else
    #         [x]
    #       end
    #     true -> [:lottery]
    #   end
    # end)

    check_in_info = extract_check_in_info(listing)
    if !is_nil(check_in_info) do
      # IO.puts "check in info"
      #IO.inspect check_in_info, label: "check-in"
    end

    cost_info = extract_cost_info(listing)
    if !is_nil(cost_info) do
      #IO.inspect cost_info, label: "cost_info"
    end

    stage_time_info = extract_stage_time_info(listing)
    if !is_nil(stage_time_info) do
      #IO.inspect stage_time_info, label: "stage_time"
    end

    performer_limit_info = extract_performer_limit_info(listing)
    if !is_nil(performer_limit_info) do
      #IO.inspect performer_limit_info, label: "performer_limit"
    end

    categories = extract_categories(listing)
    #IO.inspect categories, label: "categories"

    contact_info = extract_contact_info(listing)
    #IO.inspect contact_info, label: "contact_info"

    host_info = extract_host_info(listing)
    if !is_nil(host_info) do
      #IO.inspect host_info, label: "host_info"
    end

    extracted = {when_info, sign_up_info, check_in_info, cost_info, stage_time_info, performer_limit_info, categories, contact_info, host_info}

    meta_info = %{
      type: "badslava",
      sign_up: sign_up_info,
      check_in: check_in_info,
      cost: cost_info,
      contact: contact_info,
      performer_limit: performer_limit_info,
      host_info: host_info,
      note: note
    }

    {when_info, categories, meta_info}
  end

  defp day_diff({start_day, start_time}, {prior_day, prior_time}) do
    days = %{
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    }

    start_val = days[start_day] * 60 * 24 + (start_time.hour * 60) + start_time.minute
    prior_val = days[prior_day] * 60 * 24 + (prior_time.hour * 60) + prior_time.minute
    minutes_in_week = 7 * 24 * 60
    min_diff = if prior_val > start_val do
      start_val - (prior_val - minutes_in_week)
    else
      start_val - prior_val
    end

    -min_diff
  end

  def extract_sign_up_info(listing) do
    week_day = listing["week_day"] |> String.downcase |> String.to_atom
    start_time = listing["start_time"]
    note_string = listing["note"]
    case note_string do
      nil -> %{methods: [%{type: "in_person"}], styles: ["list"]}
      note -> 
        out = %{}
        options = get_sign_up_start_regexes |> extract_time(note)
        #IO.inspect options
        case options do
          [] -> nil
          [{:ok, val}] -> 
            #IO.puts "\n\n\n\nnegA"
            out = Map.put(out, :start, day_diff({week_day, start_time}, {week_day, val}))
        end

        options = get_sign_up_end_regexes |> extract_time(note)
        #IO.inspect options
        case options do
          [] -> nil
          [{:ok, val}] -> 
            diff_amt = day_diff({week_day, start_time}, {week_day, val})
            #IO.puts "\n\n\n\nA"
            out = Map.put(out, :end, diff_amt)
        end

        cond do
          Regex.match?(~r/by Tuesday noon/i, note) -> 
            #IO.puts "\n\n\n\nB"
            out = Map.put(out, :end, day_diff({week_day, start_time}, {:tuesday, ~T[12:00:00]}))
          Regex.match?(~r/before Thursday/i, note) -> 
            #IO.puts "\n\n\n\nC"
            out = Map.put(out, :end, day_diff({week_day, start_time}, {:thursday, ~T[00:00:00]}))
          Regex.match?(~r/(?<!confirmation )on Monday/i, note) ->
            #IO.puts "\n\n\n\nD"
            out = Map.put(out, :start, day_diff({week_day, start_time}, {:monday, ~T[00:00:00]}))
          Regex.match?(~r/on Wednesday to sign(-| )?up/, note) ->
            #IO.puts "\n\n\n\nE"
            out = Map.put(out, :start, day_diff({week_day, start_time}, {:wednesday, ~T[00:00:00]}))
          match_map = Regex.named_captures(~r/(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? .* (?<day>.*day) before/i, note) ->
            #IO.inspect week_day
            #IO.inspect start_time
            match_day = match_map["day"] |> String.downcase |> String.to_atom
            #IO.inspect match_day
            {:ok, match_time} = convert_match_map_to_time(match_map)
            #IO.inspect match_time

            #IO.puts "\n\n\n\nF"
            out = Map.put(
              out,
              :end,
              day_diff(
                {week_day, start_time},  
                {match_day, match_time}
              )
            )
          true -> nil
        end

        out = Map.put(out, :methods, extract_sign_up_methods(listing))
        out = Map.put(out, :styles, extract_sign_up_styles(listing))
        out
    end
  end

  defp get_sign_up_start_regexes do
    [
      ~r/(?:sign|show)(?:-| ?)up (?:(?:in person|by|at|is) ?)?(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(?:sign|show)(?:-| ?)up (?:(?:in person|by|at|is) ?)?(?<hour>\d\d?):?(?<minute>\d\d) ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? (?:bucket|walk-?in)? ?sign(?:-| )?up/i,
      ~r/(?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? (?:bucket|walk-?in)? ?sign(?:-| )?up/i,
      ~r/bucket out at (?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i
    ]
  end

  defp get_sign_up_end_regexes do
    [
      ~r/must arrive by (?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? walk(-| )?in cut(-| )?off/i,
    ]
  end

  defp get_sign_up_before do
    [
      ~r/must arrive by (?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
    ]
  end

  def extract_check_in_info(listing) do
    week_day = listing["week_day"] |> String.downcase |> String.to_atom
    start_time = listing["start_time"]
    note_string = listing["note"]
    case note_string do
      nil -> nil
      note -> 
        options = get_check_in_end_regexes |> extract_time(note)
        #IO.inspect options
        case options do
          [] -> nil
          [{:ok, val}] -> Map.put(%{}, :end, day_diff({week_day, start_time}, {week_day, val}))
        end
    end
  end

  defp get_check_in_end_regexes do
    [
      ~r/(arrive|show up) be(?:fo|of)re (?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(arrive|show up) by (?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
    ]
  end

  def extract_when_info(listing) do
    note_string = listing["note"]
    date = listing["date"]
    start_time = case note_string do
      nil -> listing["start_time"]
      note -> 
        options = get_start_time_regexes |> extract_time(note)
        case options do
          [] -> listing["start_time"]
          [{:ok, val}] -> val
        end
    end

    dtstart = case extract_recurrence_beginning(listing) do
      nil -> 
        {:ok, dtstart} = NaiveDateTime.new(date, start_time)
        dtstart
      val -> val
    end
   

    duration = case note_string do
      nil -> nil
      note ->
        options = get_end_time_regexes |> extract_time(note)
        end_time = case options do
          [] -> nil
          [{:ok, val}] -> 
            # IO.inspect note
            # IO.inspect val
            val
        end

        case end_time do
          nil -> 
            extract_duration(listing)
          val -> 
            {:ok, dtend} = NaiveDateTime.new(date, end_time)
            Timex.diff(dtend, dtstart, :minutes)
            # IO.inspect note
            # IO.inspect dtstart
            # IO.inspect dtend
        end
    end

    week_day = listing["week_day"]
    rrule = case String.downcase(listing["frequency"]) do
      "weekly" -> 
        %{
          freq: "weekly",
          dtstart: dtstart
        }
      "monthly" -> 
        get_monthly_rrule(week_day, dtstart, note_string)
      "bi-weekly" ->
        %{
          freq: "weekly",
          dtstart: dtstart,
          interval: 2
        }
    end

    exdates = extract_exdates(listing)

    out = %{rrule: rrule, exdate: exdates}
    out = case duration do
      nil -> out
      val -> Map.put(out, :duration, val)
    end

    out
  end

  defp get_start_time_regexes do
    [
      ~r/Please arrive before (?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? to keep your spot/Ui,
      ~r/(?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? start/Ui,
      ~r/starts at (?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/Ui
    ]
  end


  defp get_end_time_regexes do
    [
      ~r/ends by (?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/until the end \((?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(a|p)\.?m\.?)\)/i,
      ~r/.*days? \d[\d:apm.]*-(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(a|p)\.?m\.?)?/i,
      ~r/.*days? \d[\d:apm.]*-(?<hour>\d\d):?(?<minute>\d\d)? ?(?<meridiem>(a|p)\.?m\.?)?/i,

      ~r/from \d[\d:apm.]*-(?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? ?(?:on every)?/i,
    ]
  end


  defp extract_host_info(listing) do
    note_string = listing["note"]
    case note_string do
      nil -> []
      note -> 
        options = get_host_regexes |> extract_key("hosts", note)
        hosts = case options do
          [] -> []
          [val] -> 
            val 
            |> String.split([",", "&", "and"]) 
            |> Enum.filter(fn x -> String.length(x) > 0 end)
            |> Enum.map(fn x -> String.trim(x) end)
        end
        
        hosts
    end
  end

  defp get_host_regexes do
    [
      ~r/Hosted by (?<hosts>.*)\./Ui,
      ~r/! (?<hosts>.*) host\./Ui,
    ]
  end

  # :free
  # :free_plus_upgrades, upgrades
  # :free_purchase_encouraged
  # :cover, price
  # :minimum_purchase, qty
  # :cover_drink_included, price
  # :cover_or_purchase_time, price, incremental_cost
  # :cover_plus_purchase_minimum, price, qty
  # :cover_or_purchase_minimum, price, qty
  # :cover_plus_upgrades, price, upgrades
  # :minimum_purchase_plus_upgrades, qty, upgrades

  #
  # :priority_order, price, description
  # :additional_stage_time, price, qty

  defp extract_cost_info(listing) do
    note_string = listing["note"]
    case note_string do
      nil -> nil
      note -> 
        out = %{}
        options = get_cover_regexes |> extract_key("cover", note)

        cover = case options do
          [] -> nil
          [val] -> 
            convert_num_val(val)/1
        end

        options = get_min_purchase_regexes |> extract_key("minimum", note)
        minimum_purchase = case options do
          [] -> nil
          [val] -> 
            convert_num_val(val)
        end

        out = cond do
          cover && minimum_purchase -> 
            %{
              type: "cover_plus_minimum_purchase",
              data: %{cover: cover, minimum_purchase: minimum_purchase}
            }
          cover -> 
            %{
              type: "cover",
              data: %{cover: cover}
            }
          minimum_purchase -> 
            %{
              type: "minimum_purchase",
              data: %{minimum_purchase: minimum_purchase}
            }
          true -> %{type: "free"}
        end

        out = case out do
          %{type: "free"} ->
            cond do
              Regex.match?(~r/please buy something/i, note) ->
                %{type: "free_purchase_encouraged"}
              Regex.match?(~r/extra minute when you buy a drink/i, note) ->
                %{
                  type: "free_plus_upgrade", 
                  data: %{
                    upgrades: [%{
                        cost: %{type: "purchase", data: 1},
                        item: %{type: "additional_stage_time", data: 1}
                    }]
                  }
                }
              true -> out
            end
          %{type: "cover", data: cover} ->
            cond do 
              Regex.match?(~r/\$5 or \$1 per min/i, note) ->
                %{
                  type: "cover_or_purchase_time", 
                  data: %{
                    cover: cover, 
                    upgrades: [%{
                      type: %{type: "pay_with_max", data: [1, 10]},
                      item: %{type: "stage_time", data: 1}
                    }]
                  }
                }
              Regex.match?(~r/includes (1|a free) drink/i, note) ->
                %{type: "cover_drink_included", data: cover}
              Regex.match?(~r/buy an item from the bar and get an extra 2 min/i, note) ->
                %{
                  type: "cover_plus_upgrades", 
                  data: %{
                    cover: cover, 
                    upgrades: [%{
                      type: %{type: "purchase", data: 1},
                      item: %{type: "additional_stage_time", data: 2}
                    }]
                  }
                }
              true -> out
            end
          %{type: "minimum_purchase", data: qty} ->
            cond do 
              Regex.match?(~r/\$\d mic \+ 1 purchased/i, note) -> true
               %{
                  type: "purchase_minimum_plus_upgrades", 
                  data: %{
                    minimum_purchase: qty, 
                    upgrades: [%{
                      type: %{type: "pay", data: 5},
                      item: %{type: "priority_order"}
                    }]
                  }
                }
              true -> out
            end
          %{type: "cover_plus_minimum_purchase"} ->
            cond do 
              Regex.match?(~r/A dollar or a drink/i, note) ->
                %{out | type: "cover_or_minimum_purchase"}
              true -> out
            end
        end

        out
    end
  end

  defp get_cover_regexes do
    [
      ~r/^\$(?<cover>\d\d?)$/i,
      ~r/\$(?<cover>\d\d?) cover/i,
      ~r/\$(?<cover>\d\d?) plus .* drink/i,
      ~r/\$(?<cover>\d\d?) flat fee/i,
      ~r/\$(?<cover>\d\d?) for \d min/i,
      ~r/(?<cover>a) dollar or a drink/i,
      ~r/mic costs \$(?<cover>\d\d?)/i,
      ~r/plus \$(?<cover>\d\d?)/i,
      ~r/\$(?<cover>\d\d?)\/\d ?min/i,
      ~r/\$(?<cover>\d\d?) gets you \d ?min/i,
      ~r/\$(?<cover>\d\d?) you get \d ?min/i,
      ~r/\$(?<cover>\d) or \$1 per min/i,
      ~r/(?<cover>free) mic + 1 purchased item/i
    ]
  end


  defp get_min_purchase_regexes do
    [
      ~r/plus (?<minimum>one|two|1|2) drink cover/i,
      ~r/(?<minimum>one|two|1|2) item from \$\d menu/i,
      ~r/(?<minimum>one|two|1|2)(-| )?item(-| )?minimum/i,
      ~r/(?<!no longer a )(?<minimum>one|two|1|2)(-| )?drink(-| )min/i,
      ~r/(?<minimum>one|two|1|2|a) item.*min/i,
      ~r/(?<minimum>one|two|1|2|a) drink gets/i,
      ~r/(?<minimum>one|two|1|2|a) drink plus/i,
      ~r/must purchase (?<minimum>one|two|1|2)/i,
      ~r/(?<minimum>one|two|1|2|a) purchased item/i,
      ~r/(?<minimum>one|two|1|2|a) drink buys you/i,
      ~r/a dollar or (?<minimum>a) drink/i,
    ]
  end


  defp extract_stage_time_info(listing) do
    note_string = listing["note"]
    case note_string do
      nil -> nil
      note -> 
        cond do
          Regex.match?(~r/6 min(ute)?s[\/. ]*2 rounds/is, note) ->
            [%{type: "max", data: 6.0}, %{type: "max", data: 6.0}]
          Regex.match?(~r/TWO rounds of stage time 4-5 Min and 2-3 Min/is, note) ->
            [%{type: "range", data: [4.0, 5.0]}, %{type: "range", data: [2.0, 3.0]}]
          Regex.match?(~r/TWO rounds of stage time 5-6 Min and 2-3 Min/is, note) ->
            [%{type: "range", data: [5.0, 6.0]}, %{type: "range", data: [2.0, 3.0]}]
          true ->
            options = get_stage_time_regexes |> extract_two_keys("first", "second", note)

            stage_time = case options do
              [] -> nil
              [{first, nil}] -> [%{type: "max", data: convert_num_val(first)/1}]
              [{first, ""}] -> 
                # IO.inspect first
                [%{type: "max", data: convert_num_val(first)/1}]
              [{first, second}] -> 
                # IO.inspect first
                # IO.inspect second
                [%{type: "range", data: [convert_num_val(first)/1, convert_num_val(second)/1]}]
            end

            stage_time
        end
    end
  end

  defp get_stage_time_regexes do
    [
      ~r/(?<first>one|two|three|four|five|six|seven|eight|nine|10|1|2|3|4|5|6|7|8|9|10|\d\.\d) ?-? ?(?<second>one|two|three|four|five|six|seven|eight|nine|10|1|2|3|4|5|6|7|8|9|10|\d\.\d)? ?min(?:utes)?/i,
    ]
  end

  # :no_limit
  # :limit
  # :limit_plus_waitlist, limit, waitlist
  # :booked_plus_walk_in, booked, walkin

  defp extract_performer_limit_info(listing) do
    note_string = listing["note"]
    case note_string do
      nil -> nil
      note -> 
        options = get_performer_limit_regexes |> extract_key("max", note)

        max = case options do
          [] -> cond do
            match_map = Regex.named_captures(~r/(?<prebooked>\d\d?) prebooked spots, and (?<walkin>\d\d?) walk(-| )?in spots/, note) -> 
              {prebooked, _} = Integer.parse(match_map["prebooked"])
              {walkin, _} = Integer.parse(match_map["walkin"])
              %{type: "booked_plus_walkin", data: %{booked: prebooked, walk_in: walkin}}
            true -> nil
          end
          [val] -> 
            limit = convert_num_val(val)
            cond do
              match_map = Regex.named_captures(~r/(?<waitlist>\d) slot waiting list/, note) -> 
                {waitlist, _} = Integer.parse(match_map["waitlist"])
                %{type: "limit_plus_waitlist", data: %{limit: limit, waitlist: waitlist}}
              true -> %{type: "limit", data: %{limit: limit}}
            end
        end

        max
    end
  end

  defp get_performer_limit_regexes do
    [
      ~r/capped at (?<max>\d\d?) comics/i,
      ~r/first (?<max>\d\d?) comics/i,
      ~r/(?<max>\d\d?) max performing comics/i,
      ~r/stop at (?<max>\d\d?) (people|comics)/i,
      ~r/(?<max>\d\d?) comedians max/i,
      ~r/limited to (?<max>\d\d?) performers/i,
    ]
  end

  defp extract_exdates(listing) do
    []
  end

  defp extract_recurrence_beginning(listing) do
    nil
  end

  defp extract_categories(listing) do
    note = listing["note"]
    out = []
    if note do
      if Regex.match?(~r/(?!no )music(ians)?/i, note) do
        out = out ++ ["music"]
      end

      if Regex.match?(~r/(?!no )(poets|poetry)/i, note) do
        out = out ++ ["music"]
      end

      if Regex.match?(~r/(comics|comedy)/i, note) and not Regex.match?(~r/storytellers/i, note) do
        out = out ++ ["comedy"]
      end

      if Regex.match?(~r/storytell(ers|ing)/i, note) do
        out = out ++ ["storytelling"]
      end
    end

    if Enum.count(out) == 0 do
      out = out ++ ["comedy"]
    end

    out |> Enum.uniq
  end

  defp extract_contact_info(listing) do
    #IO.puts "extract contact info..."
    note = listing["note"]
    out = %{}
    if note do
      email_regex = ~r/(?<email>([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?))/
      if match_map = Regex.named_captures(email_regex, note) do
        out = Map.put(out, :email, match_map["email"])
      end


      # url_regex = ~r/(?<website>((https?|ftp):\/\/)?[^\s\/$.?#].[^\s]*)/si
      #url_regex = ~r/(?<website>((https?|ftp):\/\/)?(www.)?[^\s]*)/si
      #url_regex = ~r/(?<website>(((http|https):\/{2})?[a-ZA-Z\d_.\/]+)/is
      #url_regex = ~r/(?<website>((http|https):\/\/)?(www|thunderbirdcomedy|newyorkcomedyschool)[A-Z-a-z\d.\/_]+)/is
      url_regex = ~r/(?<website>(https?:\/\/|www)[\da-zA-Z\/._-]+)/si
      if match_map = Regex.named_captures(url_regex, note) do
        out = Map.put(out, :website, match_map["website"])
      end
    end

    out
  end

  # :in_person
  # :email
  # :email_priority
  # :email_with_upgrade, upgrade
  # :website
  # :website_priority
  # :website_with_upgrade, upgrade

  # :additional_stage_time, amount

  defp extract_sign_up_methods(listing) do
    note = listing["note"]
    out = []
    if note do
      if cap_map = Regex.named_captures(~r/email (?<email>.*@.*) to (sign up|secure a spot)/i, note) do
        out = out ++ [%{type: "email_priority"}]
      end

      if cap_map = Regex.named_captures(~r/email (before|by)/i, note) do
        out = out ++ [%{type: "email_priority"}]
      end

      if Regex.match?(~r/email (for (confirmed|a) spot|to reserve)/i, note) do
        out = out ++ [%{type: "email_priority"}]
      end

      if Regex.match?(~r/plus if you email/i, note) do
        out = out ++ [%{type: "email_priority"}]
      end

      if Regex.match?(~r/those who email will get 5 minutes/i, note) do
        out = out ++ [
          Map.put(%{}, :type, "email_with_upgrade")
          |> Map.put(:data, %{upgrades: [%{type: "additional_stage_time", data: 5}]})
        ]
      end

      if cap_map = Regex.named_captures(~r/sign(-| )?up.*(?<website>(https?:\/\/|www)[\da-zA-Z\/._-]+)/is, note) do
        out = out ++ [%{type: "website_priority"}]
      end
    end

    #if Enum.count(out) == 0 do
      out = out ++ [%{type: "in_person"}]
    #end

    out
  end

  defp extract_sign_up_styles(listing) do
    note = listing["note"]
    out = []
    if note do
      if Regex.match?(~r/we draw names/i, note) do
        out = out ++ ["bucket"]
      end

      if Regex.match?(~r/lottery style/i, note) do
        out = out ++ ["bucket"]
      end

      if Regex.match?(~r/bucket/i, note) do
        out = out ++ ["bucket"]
      end

      if Regex.match?(~r/((?<!not )lottery|bucket)/i, note) do
        out = out ++ ["bucket"]
      end

      if Regex.match?(~r/(?<!no )list/i, note) do
        out = out ++ ["list"]
      end

      if Regex.match?(~r/first come,? first (serve|perform|sign(-| )up)/i, note) do
        out = out ++ ["fcfs"]
      end
    end

    if Enum.count(out) == 0 do
      out = out ++ ["list"]
    end

    out |> Enum.uniq
  end

  defp convert_num_val(val) do
    case String.downcase(val) do
      "a" -> 1.0
      "free" -> 0.0
      "one" -> 1.0
      "1" -> 1.0
      1 -> 1.0
      "two" -> 2.0
      "2" -> 2.0
      2 -> 2.0
      "three" -> 3.0
      "3" -> 3.0
      3 -> 3.0
      "four" -> 4.0
      "4" -> 4.0
      4 -> 4.0
      "five" -> 5.0
      "5" -> 5.0
      5 -> 5.0
      "six" -> 6.0
      "6" -> 6.0
      6 -> 6.0
      "seven" -> 7.0
      "7" -> 7.0
      7 -> 7.0
      "eight" -> 8.0
      "8" -> 8.0
      8 -> 8.0
      "nine" -> 9.0
      "9" -> 9.0
      9 -> 9.0
      "ten" -> 10.0
      "10" -> 10.0
      10 -> 10.0
      val -> 
        # IO.puts "val section of convert"
        # IO.inspect val
        case val do
          "" -> 0.0
          something -> 
            out = Float.parse(val)
            case out do
              :error -> raise ArgumentError, message: "Invalid argument to convert_num_val: #{val}"
              {parsed, _} -> parsed
            end
        end
    end
  end

  defp extract_duration(listing) do
    note_string = listing["note"]
    case note_string do
      nil -> nil
      note -> 
        options = get_duration_regexes 
          |> Enum.map(fn x -> 
            Regex.named_captures(x, note) 
          end)
          |> Enum.filter(fn x -> !is_nil(x) end)
          |> Enum.map(fn match_map -> 
              #IO.puts "regex match_map"
              #IO.inspect match_map
              {hour, _} = Integer.parse(match_map["hour"])
              hour * 60
          end) 
          |> Enum.take(1)

        case options do
          [] -> nil
          [val] -> val
        end
    end
  end

  defp get_duration_regexes do
    [
      ~r/(?<hour>\d) hour mic/Ui,
    ]
  end


  # def extract_end_time(listing) do
  #   note_string = listing["note"]
  #   case note_string do
  #     nil -> nil
  #     note -> 
  #       options = get_end_time_regexes |> extract_time(note)

  #       case options do
  #         [] -> nil
  #         [{:ok, val}] -> 
  #           # IO.inspect note
  #           # IO.inspect val
  #           val
  #       end
  #   end
  # end


  defp extract_time(regexes, note) do
    regexes 
    |> Enum.map(fn x -> 
      #IO.inspect x
      Regex.named_captures(x, note) 
    end)
    |> Enum.filter(fn x -> !is_nil(x) end)
    |> Enum.map(fn match_map -> 
        # IO.puts "regex match_map"
        # IO.inspect match_map
        end_minute = case match_map["minute"] do
          nil -> 0
          "" -> 0
          val -> 
            {min, _} = Integer.parse(val)
            min
        end

        meridiem = case match_map["meridiem"] do
          nil -> "pm"
          "" -> "pm"
          val -> val |> String.replace(".", "") |> String.downcase
        end 

        {hour, _} = Integer.parse(match_map["hour"])
        case meridiem do
          "am" -> 
            Time.new(Timex.Time.to_24hour_clock(hour, :am), end_minute, 0)
          "pm" -> 
            Time.new(Timex.Time.to_24hour_clock(hour, :pm), end_minute, 0)
        end
    end) 
    |> Enum.take(1)
  end

  def convert_match_map_to_time(match_map) do
    #IO.puts "match map to time"
    #IO.inspect match_map
    end_minute = case match_map["minute"] do
      nil -> 0
      "" -> 0
      val -> 
        {min, _} = Integer.parse(val)
        min
    end

    meridiem = case match_map["meridiem"] do
      nil -> "pm"
      "" -> "pm"
      val -> val |> String.replace(".", "") |> String.downcase
    end 

    {hour, _} = Integer.parse(match_map["hour"])
    case meridiem do
      "am" -> 
        Time.new(Timex.Time.to_24hour_clock(hour, :am), end_minute, 0)
      "pm" -> 
        Time.new(Timex.Time.to_24hour_clock(hour, :pm), end_minute, 0)
    end
  end

  def extract_key(regexes, key, note) do
    regexes
    |> Enum.map(fn x -> 
      Regex.named_captures(x, note) 
    end)
    |> Enum.filter(fn x -> 
      !is_nil(x) 
    end)
    |> Enum.map(fn match_map -> 
      match_map[key]
    end) 
    |> Enum.take(1)
  end

  def extract_two_keys(regexes, key1, key2, note) do
    regexes
    |> Enum.map(fn x -> 
      Regex.named_captures(x, note) 
    end)
    |> Enum.filter(fn x -> 
      !is_nil(x) 
    end)
    |> Enum.map(fn match_map -> 
      {match_map[key1], match_map[key2]}
    end) 
    |> Enum.take(1)
  end


  def get_monthly_rrule(week_day, dtstart, note) do

    captures = case note do
      nil -> nil
      val -> 
        exp = ~r/(?<regularity>(:?4th and 5th|first and third|first|second|third|fourth|last|1st|2nd|3rd|4th|5th)) (?<day>.*day)/Ui
        Regex.named_captures(exp, val)
    end

    case captures do
      nil ->
        #IO.inspect "Nil captures"
        day = NaiveDateTime.to_date(dtstart).day
        #IO.inspect day
        week_num = round(Float.ceil(day/7))
        %{
          freq: "monthly",
          dtstart: dtstart |> Timex.to_naive_datetime,
          bysetpos: [if week_num == 5 do -1 else week_num end],
          byweekday: [week_day |> String.downcase],
        }
      %{"regularity" => regularity, "day" => week_day} -> 
        n_regularity = String.downcase(regularity)
        bysetpos = case n_regularity do
          "4th and 5th" -> [4, 5]
          "first and third" -> [1, 3]
          "first" -> [1]
          "1st" -> [1]
          "second" -> [2]
          "2nd" -> [2]
          "third" -> [3]
          "3rd" -> [3]
          "fourth" -> [4]
          "4th" -> [4]
          "fifth" -> [5]
          "5th" -> [5]
          "last" -> [-1]
        end

        %{
          freq: "monthly",
          dtstart: dtstart |> Timex.to_naive_datetime,
          bysetpos: bysetpos,
          byweekday: [week_day |> String.downcase]
        }
    end
  end  

end


      # url_regex = Regex.compile(
      #   "^" <>
      #   # protocol identifier
      #   "(?<website>(?:(?:https?|ftp)://)" <>
      #   # user:pass authentication
      #   "(?:\\S+(?::\\S*)?@)?" <>
      #   "(?:" <>
      #     # IP address exclusion
      #     # private & local networks
      #     "(?!(?:10|127)(?:\\.\\d{1,3}){3})" <>
      #     "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" <>
      #     "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" <>
      #     # IP address dotted notation octets
      #     # excludes loopback network 0.0.0.0
      #     # excludes reserved space >= 224.0.0.0
      #     # excludes network & broacast addresses
      #     # (first & last IP address of each class)
      #     "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" <>
      #     "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" <>
      #     "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" <>
      #   "|" <>
      #     # host name
      #     "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" <>
      #     # domain name
      #     "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" <>
      #     # TLD identifier
      #     "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" <>
      #     # TLD may end with dot
      #     "\\.?" <>
      #   ")" <>
      #   # port number
      #   "(?::\\d{2,5})?" <>
      #   # resource path
      #   "(?:[/?#]\\S*)?)" <>
      #   "$", "i"
      # )