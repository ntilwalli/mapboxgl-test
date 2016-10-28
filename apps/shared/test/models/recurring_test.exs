defmodule Test.Listing.GenerateRecurring do
  use ExUnit.Case
  import Ecto.Changeset
  alias Shared.Model.Recurring

  test "weekly" do
    tz = "America/New_York"
    weekly_rrule_map = %{
      "rdate" => [~N[2016-10-31 08:00:00], ~N[2016-11-01 08:00:00]],
      "rrule" => %{
        "freq" => "weekly",
        "interval" => 2,
        "dtstart" => ~N[2016-10-29 08:00:00]
      },
      "exdate" => []
    }
    
    monthly_rrule_map = %{
      "exdate" => [],
      "rrule" =>  %{
        "bysetpos" => [2], 
        "byweekday" => ["thursday"],
        "dtstart" => ~N[2016-10-27 20:00:00],
        "freq" => "monthly"
      }
    }

    cs = Recurring.changeset(%Recurring{}, weekly_rrule_map)
    #IO.inspect cs
    assert cs.valid? == true
    recurrable = apply_changes(cs)
    #IO.inspect recurrable
    assert recurrable.rrule.freq == "weekly"
    out = Recurring.between(recurrable, ~N[2016-10-21 00:00:00], ~N[2016-11-21 00:00:00], tz)
    IO.inspect out
  end

  test "monthly" do
    tz = "America/New_York"
    monthly_rrule_map = %{
      "exdate" => [],
      "rrule" =>  %{
        "bysetpos" => [-1], 
        "byweekday" => ["thursday"],
        "dtstart" => ~N[2016-10-27 20:00:00],
        "freq" => "monthly"
      }
    }

    cs = Recurring.changeset(%Recurring{}, monthly_rrule_map)
    #IO.inspect cs
    assert cs.valid? == true
    recurrable = apply_changes(cs)
    #IO.inspect recurrable
    assert recurrable.rrule.freq == "monthly"
    out = Recurring.between(recurrable, ~N[2016-10-01 00:00:00], ~N[2016-12-01 00:00:00], tz)
    IO.inspect out
  end  
end