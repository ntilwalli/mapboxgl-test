defmodule Helpers.V2 do

  def get_time_regex_patterns(type, pattern) do
      base = [
        "(?<hour>\\d)(?<minute>\\d\\d) ?(?<meridiem>(?:a\\.?|p\\.?)m\\.?)?",
        "(?<hour>\\d\\d)(?<minute>\\d\\d) ?(?<meridiem>(?:a\\.?|p\\.?)m\\.?)?",
        "(?<hour>\\d):(?<minute>\\d\\d) ?(?<meridiem>(?:a\\.?|p\\.?)m\\.?)?",
        "(?<hour>\\d\\d):(?<minute>\\d\\d) ?(?<meridiem>(?:a\\.?|p\\.?)m\\.?)?",
        "(?<hour>\\d\\d?) ?(?<meridiem>(?:a\\.?|p\\.?)m\\.?)?",
        "(?<hour>\\d)(?<minute>\\d\\d)",
        "(?<hour>\\d):(?<minute>\\d\\d)",
        "(?<hour>\\d\d)(?<minute>\\d\\d)",
        "(?<hour>\\d\d):(?<minute>\\d\\d)",
      ]

      case type do
        :append -> base |> Enum.map(fn x -> 
          {:ok, val} = Regex.compile(x <> " " <> pattern, "i") 
          val
        end)
        :prepend -> base |> Enum.map(fn x -> 
          {:ok, val} = Regex.compile(pattern <> " " <> x, "i")
          val
        end)
      end
  end

  def get_minutes_before_event_start(minutes) do
    %{
      type: "minutes_before_event_start",
      data: %{
        minutes: minutes
      }
    }
  end

  def get_minutes_after_event_start(minutes) do
    %{
      type: "minutes_after_event_start",
      data: %{
        minutes: minutes
      }
    }
  end  

  def get_event_start do
    %{
      type: "event_start",
    }
  end

  def parse_note_with_regexes(regexes, note, fallback_val, processor_fn) do
    cond do
      note ->
        #IO.inspect {"Parsing note", note}
        matches = regexes 
          |> Enum.map(fn x -> {x, note, Regex.named_captures(x, note)} end)
          |> Enum.filter(fn x -> !is_nil(elem(x, 2)) end)
        time = case matches do
          [] -> 
            #IO.puts "No matches"
            fallback_val
          [val | tail] ->
            #IO.inspect {:matches, matches}
            processor_fn.(elem(val, 2))
        end
      true -> 
        #IO.inspect {"Not parsing note", note}
        fallback_val
    end
  end

  def convert_to_time_string(val) do
    #IO.inspect {"convert_to_time_string", val}
    hour = val["hour"]
    minute = case  val["minute"] do
      nil -> '00'
      "" -> '00'
      val -> val
    end
    meridiem = case val["meridiem"] do
      nil -> "pm"
      "" -> "pm"
      "a" ->"am"
      "p" -> "pm"
      "A" -> "am"
      "P" -> "pm"
      "am" -> "am"
      "pm" -> "pm"
      "AM" -> "am"
      "PM" -> "pm"
      "a.m." -> "am"
      "p.m." -> "pm"
      "a.m" -> "am"
      "p.m" -> "pm"
      "am." -> "am"
      "pm." -> "pm"
      "AM." -> "am"
      "PM." -> "pm"
      val -> val
    end 
    val = "#{hour}:#{minute}#{meridiem}"
    #IO.inspect {"found time", val}
    val
  end

  def email_processor(val) do
    email = val["email"]
    #IO.inspect {"found email", email}
    email
  end

  def convert_hour(hour, meridiem) do
    case meridiem do
      "AM" -> 
        case hour do
          12 -> 0
          _ -> hour
        end
      "PM" -> 
        case hour do
          12 -> 12
          _ -> hour + 12
        end
    end
  end


  def convert_to_time(val) do
    #IO.inspect val
    captures = Regex.named_captures(~r/^(?<hour>\d\d?):(?<minute>\d\d)(?<meridiem>(am|pm|AM|PM|a.m.|p.m.|A.M.|P.M.))$/, val)

    meridiem = captures["meridiem"]
    hour = case meridiem do
      "am" -> convert_hour(String.to_integer(captures["hour"]), "AM")
      "pm" -> convert_hour(String.to_integer(captures["hour"]), "PM")
      "AM" -> convert_hour(String.to_integer(captures["hour"]), "AM")
      "PM" -> convert_hour(String.to_integer(captures["hour"]), "PM")
      "a.m." -> convert_hour(String.to_integer(captures["hour"]), "AM")
      "p.m." -> convert_hour(String.to_integer(captures["hour"]), "PM")
      "A.M." -> convert_hour(String.to_integer(captures["hour"]), "AM")
      "P.M." -> convert_hour(String.to_integer(captures["hour"]), "PM")
    end
    minute = String.to_integer(captures["minute"])
    case Time.new(hour, minute, 0) do
      {:ok, val} -> val
      _ -> raise ArgumentError, message: "Invalid argument #{val}"
    end
  end

  
  def day_diff({start_day, start_time}, {prior_day, prior_time}) do
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
  
  def any_match(regexes, note) do
    regexes |> Enum.any?(fn x -> Regex.match?(x, note) end)
  end

  def extract_time(regexes, note) do
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
            Time.new(hour, end_minute, 0)
          "pm" -> 
            Time.new(hour + 12, end_minute, 0)
        end
    end) 
    |> Enum.take(1)
  end

  def val_to_float(val) do
    case String.downcase(val) do
      "a" -> 1.0
      "free" -> 0.0
      "one" -> 1.0
      "1" -> 1.0
      "two" -> 2.0
      "2" -> 2.0
      "three" -> 3.0
      "3" -> 3.0
      "four" -> 4.0
      "4" -> 4.0
      "five" -> 5.0
      "5" -> 5.0
      "six" -> 6.0
      "6" -> 6.0
      "seven" -> 7.0
      "7" -> 7.0
      "eight" -> 8.0
      "8" -> 8.0
      "nine" -> 9.0
      "9" -> 9.0
      "ten" -> 10.0
      "10" -> 10.0

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


end