 defmodule Test.Standard.PerformerCheckIn do 
  use ExUnit.Case
  #@tag :pending

  test "standard check in" do
    bs =  %{
      begins: %{
        type: "minutes_before_event_start",
        data: %{
          minutes: 15
        }
      }, 
      ends: %{
        type: "previous_weekday_at_time",
        data: %{
          day: "wednesday",
          time: %{
            hour: 17,
            minute: 0
          }
        }
      }, 
      enable_in_app: true
    }

    cs = Standard.PerformerCheckIn.changeset(%Standard.PerformerCheckIn{}, bs)
    #IO.inspect cs
    assert cs.valid? == true
  end
end