defmodule PeformerLimit do
  import Helpers.V2


  defp get_limit(data) do
    %{
      type: "limit",
      data: %{
        limit: data
      }
    }
  end
  defp get_sub_limit(data) do
    %{
      type: "limit",
      data: data
    }
  end
  defp get_limit_by_type(in_person, pre_registration) do
    %{
      type: "limit_by_sign_up_type",
      data: %{
        in_person: get_sub_limit(in_person),
        pre_registration: get_sub_limit(pre_registration)
      }
    }
  end

  defp performer_limit_processor(x) do
    cond do
      x["limit"] -> 
        {limit, _} = Integer.parse(x["limit"])
        get_limit(limit)
      x["in_person"] ->
        {in_person, _} = Integer.parse(x["in_person"])
        {pre_registration, _} = Integer.parse(x["pre_registration"])
        get_limit_by_type(in_person, pre_registration)   
      true ->
        nil     
    end
  end

  defp get_performer_limit_regexes do
    regexes = [
      ~r/(?<pre_registration>\d+) spots by email.*(?<in_person>\d+) .*(in-person|bucket|list)/i,
      ~r/(?<limit>\d+) (people|comic|performers|comedians)/i,
      ~r/(?<pre_registration>\d+) prebooked .* (?<in_person>\d+) walk(-| )?in/i
    ]

    regexes
  end

  defp parse_note(note) do
    out = parse_note_with_regexes(
      get_performer_limit_regexes, 
      note, 
      nil, 
      &performer_limit_processor/1
    )
    #IO.inspect {"performer_limit", out}
    out
  end

  def get_performer_limit(listing) do
    note = listing["note"]
    case note do
      nil -> nil
      val -> parse_note(note)
    end
  end

end

