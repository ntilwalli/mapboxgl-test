 defmodule Test.Listing.Meta.Standard do 
  use ExUnit.Case
  # #@tag :pending

  test "meta standard changeset" do

    bs = %{
      categories: ["comedy"], 
      listed_hosts: [],
      notes: "$5 for 6 mins.  2 Rounds.  First come, first serve. ",
      performer_check_in: nil,
      performer_cost: [%{data: %{cover: 5.0}, type: "cover"}], 
      performer_limit: nil,
      performer_sign_up: %{
        data: %{
          in_person: %{
            begins: nil, 
            ends: nil,
            styles: ["list"]
          }
        }, 
        type: "in_person"
      },
      stage_time: [%{data: %{data: %{max: 6.0}, type: "max"}, type: "minutes"}],
      type: "standard"
    }


    cs = Meta.Standard.changeset(%Meta.Standard{}, bs)
    IO.inspect cs
    assert cs.valid? == true
    assert 1 == 1
  end

end