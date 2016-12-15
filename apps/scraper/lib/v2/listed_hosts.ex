defmodule ListedHosts do
  import Helpers.V2

  defp host_processor(x) do
    case x["hosts"] do
      nil -> []
      val -> 
        val 
        |> String.split([",", "&", "and"]) 
        |> Enum.filter(fn x -> String.length(x) > 0 end)
        |> Enum.map(fn x -> String.trim(x) end)
    end
  end

  def get_listed_hosts(listing) do
    regexes = [
      ~r/Hosted by (?<hosts>.*)\./Ui,
      ~r/! (?<hosts>.*) host\./Ui,
    ]

    case listing["note"] do
      nil -> []
      note -> 
        parse_note_with_regexes(regexes, note, [], &host_processor/1)
    end
  end
end
