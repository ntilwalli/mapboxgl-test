defmodule Helpers.V2 do
  def parse_note(regexes, note, default_val, processor_fn) do
    cond do
      note ->
        #IO.inspect {"Parsing note", note}
        matches = regexes 
          |> Enum.map(fn x -> Regex.named_captures(x, note) end)
          |> Enum.filter(fn x -> !is_nil(x) end)
        time = case matches do
          [] -> 
            #IO.puts "No matches"
            default_val
          [val | tail] ->
            #IO.puts "Matches"
            processor_fn.(val)
        end
      true -> 
        #IO.inspect {"Not parsing note", note}
        default_val
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
    IO.inspect {"found email", email}
    email
  end


  def convert_to_time(val) do
    #IO.inspect val
    captures = Regex.named_captures(~r/^(?<hour>\d\d?):(?<minute>\d\d)(?<meridiem>(am|pm|AM|PM))$/, val)

    meridiem = captures["meridiem"]
    hour = case meridiem do
      "am" -> String.to_integer(captures["hour"])
      "pm" -> String.to_integer(captures["hour"]) + 12
      "AM" -> String.to_integer(captures["hour"])
      "PM" -> String.to_integer(captures["hour"]) + 12
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
    regexes |> Enum.any?(fn x -> Regex.match(x, note) end)
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
end