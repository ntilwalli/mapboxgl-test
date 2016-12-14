defmodule PerformerCostStageTime do
  import Helpers.V2
  
  defp not_specified()do
    %{
      type: "not_specified",
    }
  end

  def get_multi_tier(note) do 
    cond do
      Regex.match?(~r/free but if you buy a drink at the bar/i, note) ->
        tier_1 = %{
          type: "free",
          perk: %{
            type: "no_perk"
          }
        }

        tier_2 = %{
          type: "minimum_purchase",
          data: %{
            minimum_purchase: %{
              type: "drink",
              data: 1
            }
          },
          perk: %{
            type: "bucket_entry"
          }
        }

        [tier_1, tier_2]

      true -> nil
    end
  end

  def get_multi_round(note) do
    regexes = [
      ~r/\$(?<round>\d+) ?min(utes)?/i
    ]

    regexes |> Enum.map(fn re -> 
      result = Regex.scan(re, note)
      case Enum.count(result) do
        0 -> nil
        _ -> 
          ["multi", "round"]
      end
    end)
  end

  def cost_processor(x) do
    purchase_type = x["min_purchase_type"]
    cover = x["cover"]
    free = x["free"]
    cond do
      purchase_type && cover ->
        type = case x["or"] do
          nil -> "cover_and_minimum_purchase"
          _ -> "cover_or_minimum_purchase"
        end
        data = x["min_purchase_data"]
        %{
          type: type,
          data: %{
            minimum_purchase: %{
              type: String.downcase(purchase_type),
              data: val_to_float(data)
            },
            cover: val_to_float(cover)
          }
        }

      purchase_type -> 
        data = x["min_purchase_data"]
        %{
          type: "minimum_purchase",
          data: %{
            minimum_purchase: %{
              type: String.downcase(purchase_type),
              data: val_to_float(data)
            }
          }
        }
      cover -> 
        %{
          type: "cover",
          data: %{
            cover: val_to_float(cover)
          }
        }
      free -> %{
        type: "free"
      }
      true -> nil
    end
  end

  def get_cost(note) do
    regexes =[
      ~r/\$(?<cover>\d+) cover(?<and>(,|and)) (?<min_purchase_data>(\d+|one|two)) (?<min_purchase_type>(drink|item))/i,
      ~r/\$(?<cover>\d+) gets you a drink ticket/i,
      ~r/^(?<free>free)./i,
      ~r/(?>!get 1 )(?<free>free(?!( appetizers| Mics and)))/i,
      ~r/(?<free>no cover)/i,
      ~r/(?<free>drink encouraged)/i,
      ~r/\$(?<cover>\d+) flat fee/i,
      ~r/\$(?<cover>\d+)(\/| for )\d+ min(ute)?s?/i,
      ~r/(?<!no longer a )(?<min_purchase_data>(\d+|one|two))( |-)?(?<min_purchase_type>(item|drink))/i,
      ~r/\$(?<cover>\d+) cover/i,
    ]

    out = parse_note_with_regexes(regexes, note, not_specified, &cost_processor/1)
  end

  def stage_time_processor(x) do
    min = x["min"]
    max = x["max"]
    cond do
      min && max ->
        %{
          type: "minutes",
          data: %{
            type: "range",
            data: %{
              min: val_to_float(min),
              max: val_to_float(max)
            }
          }
        }

      max -> 
        %{
          type: "minutes",
          data: %{
            type: "max",
            data: %{
              max: val_to_float(max)
            }
          }
        }
      true -> nil
    end
  end

  def get_stage_time(note) do
    regexes =[
      ~r/(?<min>\d+)-(?<max>\d+) ?min(ute)?s?/i,
      ~r/(?<max>\d+) min(ute)?s?/i
    ]

    out = parse_note_with_regexes(regexes, note, not_specified, &stage_time_processor/1)
  end

  def scan(regex_map, note) do
    regex_map |> Map.keys |> Enum.map(fn re -> 
      result = Regex.scan(re, note)
      count = Enum.count(result)
      case count do
        0 -> nil
        _ -> {re, result, regex_map[re]}
      end
    end) |> Enum.filter(fn x -> !is_nil(x) end)
  end



  def parse_note(note) do
    # multi_round = get_multi_round(note)
    multi_tier = get_multi_tier(note)
    # combo_cost = get_combo_price_cost(note)
    cond do
      # multi_round -> 
      #   [multi_round, [get_cost(note)]]
      multi_tier -> 
        [multi_tier, [get_stage_time(note)]]
      true ->
        # get cost and stage time individually
        #"Get cost individually"
        {[get_cost(note)], [get_stage_time(note)]}
    end
    # multi-scan all regexes return regex and map of result

  end


  def get_performer_cost_stage_time(listing) do
    note = listing["note"]
    case note do
      nil -> {not_specified, not_specified}
      val -> parse_note(note)
    end
  end
end
