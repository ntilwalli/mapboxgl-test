defmodule PerformerCheckIn do
  import Helpers.V2
  

  # defp get_check_in_ends(listing) do
  #   note = listing["note"]
  #   week_day = listing["week_day"] |> String.downcase |> String.to_atom
  #   start_time = listing["start_time"]
    
  #   regexes = [
  #     ~r/must (arrive|show up) (by|before) (?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
  #   ]

  #   time_string = parse_note_with_regexes(regexes, note, nil, &convert_to_time_string/1)
  #   time = case time_string do
  #     nil -> nil
  #     val -> convert_to_time(val)
  #   end

  #   case time do
  #     nil -> nil
  #     val  ->
  #       #IO.inspect {"in person ends calc params", week_day, start_time, week_day, val}
  #       diff = Calendar.Time.diff(start_time, val)
  #       #IO.inspect {"diff", diff}
  #       minutes = cond do
  #         diff > 0 -> get_minutes_before_event_start(round(diff/60))
  #         diff === 0 -> get_event_start
  #         diff < 0 -> get_minutes_after_event_start(round(-diff/60))
  #       end
  #   end
  # end



  def parse_listing(listing) do
    cond do
      true -> nil
    end
  end

  def get_check_in(listing) do
    note = listing["note"]
    case note do
      nil -> nil
      val -> parse_listing(listing)
    end
  end
end
