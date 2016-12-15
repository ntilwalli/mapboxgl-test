defmodule PerformerCostStageTime do
  import Helpers.V2

  def get_hardcoded(note) do 
    cond do   
      Regex.match?(~r/$5 cover. You get TWO rounds of stage time 5-6 Min and 2-3 Min as long as you get on time./, note) ->
        stage_time = [
          %{
            type: "minutes",
            data: %{
              minutes: %{
                type: "range",
                data: %{
                  max: 6,
                  min: 5
                }
              }
            }
          },
          %{
            type: "minutes",
            data: %{
              minutes: %{
                type: "range",
                data: %{
                  max: 3,
                  min: 2
                }
              }
            }
          }
        ]

        cost = [
          %{
            type: "cover",
            data: %{
              cover: 5
            },
            perk: %{
              type: "no_perk"
            }
          }
        ]

        [cost, stage_time]

      Regex.match?(~r/\$5\/6 minutes\/2 rounds First Come, First Serve/, note) ->
        stage_time = [
          %{
            type: "minutes",
            data: %{
              minutes: %{
                type: "max",
                data: %{
                  max: 6
                }
              }
            }
          },
          %{
            type: "minutes",
            data: %{
              minutes: %{
                type: "max",
                data: %{
                  max: 6
                }
              }
            }
          }
        ]

        cost = [
          %{
            type: "cover",
            data: %{
              cover: 5
            },
            perk: %{
              type: "no_perk"
            }
          }
        ]

        [cost, stage_time]
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
            type: "additional_bucket_entry"
          }
        }

        [[tier_1, tier_2], [get_cost(note)]]
      Regex.match?(~r/\$5\/5 min Early spots.*\$3\/4 min Early spots.*FREE RANDOMLY SELECTED SPOTS/, note) ->
        cost = [
          %{
            type: "minimum_purchase",
            data: %{
              minimum_purchase: %{
                type: "drink",
                data: 1
              }
            },
            perk: %{
              type: "no_perk"
            }
          },
          %{
            type: "cover_and_minimum_purchase",
            data: %{
              cover: 3,
              minimum_purchase: %{
                type: "drink",
                data: 1
              }
            },
            perk: %{
              type: "minutes_and_priority_order",
              data: 4
            }
          },
          %{
            type: "cover_and_minimum_purchase",
            data: %{
              cover: 5,
              minimum_purchase: %{
                type: "drink",
                data: 1
              }
            },
            perk: %{
              type: "minutes_and_priority_order",
              data: 5
            }
          }
        ]

        stage_time = []

        [cost, stage_time]
      true -> nil
    end
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
        case x["drink_ticket"] do
          nil ->
            %{
              type: "cover",
              data: %{
                cover: val_to_float(cover)
              }
            }
          _ -> 
            %{
              type: "cover",
              data: %{
                cover: val_to_float(cover)
              },
              perk: %{
                type: "drink_ticket",
                data: 1
              }
            }
        end

      free -> %{
        type: "free"
      }
      true -> nil
    end
  end

  def get_cost(note) do
    regexes =[
      ~r/\$(?<cover>\d+) cover(?<and>(,|and)) (?<min_purchase_data>(\d+|one|two)) (?<min_purchase_type>(drink|item))/i,
      ~r/\$(?<cover>\d+) plus (?<min_purchase_data>(\d+|one|two)) (?<min_purchase_type>(drink|item))/i,
      ~r/\$(?<cover>\d+) plus (?<min_purchase_data>(\d+|one|two)) beverage\/(?<min_purchase_type>(drink|item))/i,
      ~r/\$(?<cover>\d+) gets you a (?<drink_ticket>drink ticket)/i,
      ~r/\$(?<cover>\d+) gets you .* and (?<drink_ticket>a drink)/i,
      ~r/purchase (?<min_purchase_data>(\d+|one|two)) food or drink (?<min_purchase_type>(drink|item))/i,
      ~r/^(?<free>free)./i,
      ~r/(?<free>, free,)/i,
      ~r/(?<free>totally free)/i,
      ~r/(?>!get 1 )(?<free>free(?!( appetizers| Mics and)))/i,
      ~r/(?<free>no cover)/i,
      ~r/(?<free>drink encouraged)/i,
      ~r/\$(?<cover>\d+) flat fee/i,
      ~r/\$(?<cover>\d+)(\/| for )\d+ min(ute)?s?/i,
      ~r/(?<!no longer a )(?<min_purchase_data>(\d+|one|two))( |-)?(?<min_purchase_type>(item|drink))/i,
      ~r/\$(?<cover>\d+) cover/i,
      ~r/\$(?<cover>\d+\.\d\d) /i,
      ~r/\$(?<cover>\d)/i
    ]

    out = parse_note_with_regexes(regexes, note, nil, &cost_processor/1)
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
      ~r/(?<max>\d+) ?min(ute)?s?/i
    ]

    out = parse_note_with_regexes(regexes, note, not_specified, &stage_time_processor/1)
  end


  def parse_note(note) do
    hardcoded = get_hardcoded(note)
    cond do
      hardcoded -> 
        hardcoded
      true ->
        {[get_cost(note)], [get_stage_time(note)]}
    end

  end


  def get_performer_cost_stage_time(listing) do
    note = listing["note"]
    case note do
      nil -> {not_specified, not_specified}
      val -> parse_note(note)
    end
  end
end
