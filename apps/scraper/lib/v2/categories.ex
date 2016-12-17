defmodule Categories do
  
  def get_categories(listing) do
    note = listing["note"]
    out = []
    if note do
      if Regex.match?(~r/(?<!no )(comics|comedy)/i, note) and not Regex.match?(~r/storytellers/i, note) do
        out = out ++ ["comedy"]
      end

      if Regex.match?(~r/(?<!no )music/i, note) do
        out = out ++ ["music"]
      end

      if Regex.match?(~r/(?<!no )poetry/i, note) do
        out = out ++ ["poetry"]
      end

      if Regex.match?(~r/(?<!no )(storytelling|stories)/i, note) do
        out = out ++ ["storytelling"]
      end

    end

    out = case Enum.count(out) do
      0 -> ["comedy"]
      _ -> out
    end

    out |> Enum.uniq
  end

end