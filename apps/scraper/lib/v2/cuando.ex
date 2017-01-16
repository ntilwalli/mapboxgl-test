defmodule Cuando do
  import Helpers.V2

  def get_cuando(listing) do
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
            {:ok, seconds, _, _} = Calendar.NaiveDateTime.diff(dtend, dtstart)
            seconds/60
            # IO.inspect note
            # IO.inspect dtstart
            # IO.inspect dtend
        end
    end

    week_day = listing["week_day"]
    rrules = case String.downcase(listing["frequency"]) do
      "weekly" -> 
        [%{
          "freq" => "weekly",
          "dtstart" => dtstart,
          "byweekday" => [week_day |> String.downcase]

        }]
      "monthly" -> 
        get_monthly_rrule(week_day, dtstart, note_string)
      "bi-weekly" ->
        [%{
          "freq" => "weekly",
          "dtstart" => dtstart,
          "byweekday" => [week_day |> String.downcase],
          "interval" => 2
        }]
    end

    #exdates = extract_exdates(listing)

    out = %{"rrules" => rrules, "rdate" => [], "exdate" => []}
    out = case duration do
      nil -> out
      val -> Map.put(out, "duration", val)
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

  defp extract_exdates(listing) do
    []
  end

  defp extract_recurrence_beginning(listing) do
    nil
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


  def get_monthly_rrule(week_day, dtstart, note) do

    captures = case note do
      nil -> nil
      val -> 
        exp = ~r/(?<regularity>(:?4th and 5th|first and third|2nd and 4th|second and fourth|first|second|third|fourth|last|1st|2nd|3rd|4th|5th)) (?<day>.*day)/Ui
        Regex.named_captures(exp, val)
    end

    case captures do
      nil ->
        #IO.inspect "Nil captures"
        day = NaiveDateTime.to_date(dtstart).day
        #IO.inspect day
        week_num = round(Float.ceil(day/7))
        [%{
          "freq" => "monthly",
          "dtstart" => dtstart, #|> Calendar.DateTime.to_naive,
          "bysetpos" => [if week_num == 5 do -1 else week_num end],
          "byweekday" => [week_day |> String.downcase],
        }]
      %{"regularity" => regularity, "day" => week_day} -> 
        n_regularity = String.downcase(regularity)
        bysetpos = case n_regularity do
          "4th and 5th" -> [4, 5]
          "first and third" -> [1, 3]
          "2nd and 4th" -> [2, 4]
          "second and fourth" -> [2, 4]
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

        Enum.map(bysetpos, fn pos -> %{
          "freq" => "monthly",
          "dtstart" => dtstart, #|> Calendar.DateTime.to_naive,
          "bysetpos" => [pos],
          "byweekday" => [week_day |> String.downcase]
        } end)
    end
  end  



end