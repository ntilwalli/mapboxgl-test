defmodule Scraper.Helpers do
  def replace_apos(val) do
    Regex.replace(~r/&apos;/, val, "'") 
  end

  def convert_to_time(val) do
    captures = Regex.named_captures(~r/^(?<hour>\d\d?):(?<minute>\d\d)(?<meridiem>[a|p]m)$/, val)

    meridiem = captures["meridiem"]
    hour = Timex.Time.to_24hour_clock(String.to_integer(captures["hour"]), String.to_atom(meridiem))
    minute = String.to_integer(captures["minute"])
    case Time.new(hour, minute, 0) do
      {:ok, val} -> val
      _ -> raise ArgumentError, message: "Invalid argument #{val}"
    end
  end
end