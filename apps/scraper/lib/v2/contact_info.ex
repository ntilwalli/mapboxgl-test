defmodule ContactInfo do
  import Helpers.V2


  def get_contact_info(listing) do
    #IO.puts "extract contact info..."
    note = listing["note"]
    out = %{
      email: listing["email"],
      phone: listing["phone"]
    }

    if note do
      email_regex = ~r/(?<email>([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?))/
      if match_map = Regex.named_captures(email_regex, note) do
        out = Map.put(out, :email, match_map["email"])
      end

      url_regex = ~r/(?<website>(https?:\/\/|www)[\da-zA-Z\/._-]+)/si
      if match_map = Regex.named_captures(url_regex, note) do
        out = Map.put(out, :website, match_map["website"])
      end
    end

    out
  end
end