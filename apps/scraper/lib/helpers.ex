
defmodule Scraper.Helpers do
  def replace_apos(val) do
    Regex.replace(~r/&apos;/, val, "'") 
  end
end