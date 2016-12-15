defmodule PerformerSignUp do
  import Helpers.V2
  
  defp not_specified do 
    %{
      type: "not_specified"
    }
  end

  defp get_previous_weekday_at_time(day, hour, minute) do
    %{
      type: "previous_weekday_at_time",
      data: %{
        day: day,
        time: %{
          hour: hour,
          minute: minute
        }
      }
    }
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


  def get_in_person_begins(listing) do
    note = listing["note"]

    regexes = [
      ~r/(?:sign|show)(?:-| ?)up (?:(?:in person|by|at|is) ?)?(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(?:sign|show)(?:-| ?)up (?:(?:in person|by|at|is) ?)?(?<hour>\d\d?):?(?<minute>\d\d) ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? (?:bucket|walk-?in)? ?sign(?:-| )?up/i,
      ~r/(?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? (?:bucket|walk-?in)? ?sign(?:-| )?up/i,
      ~r/bucket out at (?<hour>\d\d?):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(?<hour>\d\d?):?(?<minute>\d\d)? sign-?up\/\d(?<meridiem>(?:a\.?|p\.?)m\.?) start/i
    ]

    time_string = parse_note_with_regexes(regexes, note, nil, &convert_to_time_string/1)
    time = case time_string do
      nil -> nil
      val -> convert_to_time(val)
    end

    case time do
      nil -> nil
      val  ->
        week_day = listing["week_day"] |> String.downcase |> String.to_atom
        start_time = listing["start_time"]
        #IO.inspect {"in person begins calc params", week_day, start_time, week_day, val}
        diff = Calendar.Time.diff(start_time, val)
        #IO.inspect {"diff", diff}
        minutes = cond do
          diff > 0 -> get_minutes_before_event_start(round(diff/60))
          diff === 0 -> get_event_start
          diff < 0 -> get_minutes_after_event_start(round(-diff/60))
        end
    end
  end

  defp get_in_person_ends(listing) do
    note = listing["note"]
    week_day = listing["week_day"] |> String.downcase |> String.to_atom
    start_time = listing["start_time"]
    
    regexes = [
      ~r/must (arrive|show up) (by|before) (?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)?/i,
      ~r/(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? walk(-| )?in cut(-| )?off/i,
    ]

    time_string = parse_note_with_regexes(regexes, note, nil, &convert_to_time_string/1)
    time = case time_string do
      nil -> nil
      val -> convert_to_time(val)
    end

    case time do
      nil -> nil
      val  ->
        #IO.inspect {"in person ends calc params", week_day, start_time, week_day, val}
        diff = Calendar.Time.diff(start_time, val)
        #IO.inspect {"diff", diff}
        minutes = cond do
          diff > 0 -> get_minutes_before_event_start(round(diff/60))
          diff === 0 -> get_event_start
          diff < 0 -> get_minutes_after_event_start(round(-diff/60))
        end
    end
  end
  defp get_in_person_styles(listing) do
    extract_sign_up_styles(listing)
  end

  defp exclude_in_person(listing) do
    note = listing["note"]
    regexes = [
      ~r/must email/
    ]
    parse_note_with_regexes(regexes, note, false, fn _ -> true end)
  end

  def default_not_specified(val) do
    case val do
      nil -> not_specified
      _ -> val
    end
  end

  defp get_in_person_sign_up(listing) do
    note = listing["note"]
    case note do
      nil -> nil
      val -> 
        cond do
          exclude_in_person(listing) ->
            nil
          true ->
            begins = get_in_person_begins(listing)
            ends = get_in_person_ends(listing)
            styles = get_in_person_styles(listing)
            count = Enum.count(styles)
            cond do
              !!(begins || ends || count > 0) -> 
                %{
                  begins: default_not_specified(begins),
                  ends: default_not_specified(ends),
                  styles: styles
                }
              true -> nil
            end
        end
    end
  end
  defp get_pre_registration_begins_ends(listing) do
    note = listing["note"]
    cond do
      Regex.match?(~r/by Tuesday noon/i, note) -> 
        {get_previous_weekday_at_time("tuesday", 12, 0), not_specified()}
      Regex.match?(~r/before Thursday/i, note) -> 
        {not_specified(), get_previous_weekday_at_time("thursday", 0, 0)}
      Regex.match?(~r/(?<!confirmation )on Monday/i, note) ->
        {get_previous_weekday_at_time("monday", 0, 0), get_previous_weekday_at_time("tuesday", 0, 0)}
      Regex.match?(~r/on Wednesday to sign(-| )?up/, note) ->
        {get_previous_weekday_at_time("wednesday", 0, 0), get_previous_weekday_at_time("wednesday", 0, 0)}
      match_map = Regex.named_captures(~r/(?<hour>\d):?(?<minute>\d\d)? ?(?<meridiem>(?:a\.?|p\.?)m\.?)? .* (?<day>.*day) before/i, note) ->
        match_day = match_map["day"] |> String.downcase
        time_string = convert_to_time_string(match_map)
        time = convert_to_time(time_string)
        {not_specified(), get_previous_weekday_at_time(match_day, time.hour, time.minute)}
      true -> {not_specified, not_specified}
    end 
  end

  defp get_website_registration(listing) do
    default_website = listing["website"]
    note = listing["note"]
    regexes = [
      ~r/sign[ \-]?up.+ (?<website>(http:\/\/|www\.)[a-zA-Z0-9\-\/.]+)/i,
      #~r/(?<website>(http:\/\/|www\.)[a-zA-Z0-9\-\/.]+)/i,
    ]

    parse_note_with_regexes(regexes, note, nil, fn x -> 
      #IO.inspect {"got here", x}
      case x["website"] do
        nil -> {"website", default_website}
        val -> {"website", val} 
      end
    end)
  end

  defp get_email_registration(listing) do
    default_email = listing["email"]
    note = listing["note"]
    regexes = [
      ~r/e-?mail preferred/i,
      ~r/e-?mail (?<email>[a-zA-Z.0-9_\-]+@[a-zA-Z.0-9_\-]+)(?! for more info)/i  
    ]

    parse_note_with_regexes(regexes, note, nil, fn x -> 
      #IO.inspect {"got here", x}
      case x["email"] do
        nil -> {"email", default_email}
        val -> {"email", val} 
      end
    end)
  end

  defp get_pre_registration_type(listing) do
    email = get_email_registration(listing)
    website = get_website_registration(listing)
    case email do
      nil ->
        case website do
          nil -> nil
          val -> val
        end
      email -> email
    end
  end
  defp exclude_pre_registration(listing) do
    note = listing["note"]
    regexes = [
      ~r/no email/,
      ~r/email .* for more info/i  
    ]
    parse_note_with_regexes(regexes, note, false, fn x -> true end)
  end

  defp get_pre_registration_sign_up(listing) do
    note = listing["note"]
    case note do
      nil -> nil
      val -> 
        cond do
          exclude_pre_registration(listing) -> nil
          true -> 
            out = get_pre_registration_type(listing)
            #IO.inspect({"out", out})
            case out do
              nil -> nil
              {type, data} ->
                IO.inspect({"pre registration type", out})
                {begins, ends} = get_pre_registration_begins_ends(listing)
                %{
                  type: type,
                  data: data,
                  begins: begins,
                  ends: ends
                }
            end
        end
    end  
  end

  defp extract_sign_up_styles(listing) do
    note = listing["note"]
    out = []
    if note do
      if Regex.match?(~r/we draw names/i, note) do
        out = out ++ ["bucket"]
      end

      if Regex.match?(~r/by email/i, note) do
        out = out ++ ["list"]
      end

      if Regex.match?(~r/((?<!not )lottery|bucket)/i, note) do
        out = out ++ ["bucket"]
      end

      if Regex.match?(~r/(?<!no )list(?! will now stop)/i, note) do
        out = out ++ ["list"]
      end

      if Regex.match?(~r/random(ly)?/i, note) do
        out = out ++ ["bucket"]
      end


      if Regex.match?(~r/first come,? first (serve|perform|sign(-| )up)/i, note) do
        out = out ++ ["list"]
      end
    end

    out |> Enum.uniq
  end

  def parse_listing(listing) do
    in_person = get_in_person_sign_up(listing)
    pre_registration = get_pre_registration_sign_up(listing)
    cond do
      in_person && pre_registration ->
        %{
          type: "in_person_and_pre_registration",
          data: %{
            in_person: in_person,
            pre_registration: pre_registration
          }
        }
      in_person ->
        %{
          type: "in_person",
          data: %{
            in_person: in_person,
          }
        }
      pre_registration -> 
        %{
          type: "pre_registration",
          data: %{
            pre_registration: pre_registration,
          }
        }
      true -> not_specified
    end
  end

  def get_performer_sign_up(listing) do
    note = listing["note"]
    case note do
      nil -> not_specified
      val -> parse_listing(listing)
    end
  end



end
