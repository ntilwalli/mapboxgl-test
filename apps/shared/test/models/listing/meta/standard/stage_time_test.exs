 defmodule Test.Standard.StageTime do 
  use ExUnit.Case
  #@tag :pending

  test "standard stage time" do
    bs =  %{
      type: "minutes_or_songs",
      data: %{
        minutes: %{
          type: "range",
          data: %{
            min: 3,
            max: 4
          }
        },
        songs: 5
      }
    }

    cs = Standard.StageTime.changeset(%Standard.StageTime{}, bs)
    #IO.inspect cs
    assert cs.valid? == true
  end
end