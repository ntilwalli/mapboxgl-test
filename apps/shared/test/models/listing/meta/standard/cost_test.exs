 defmodule Test.Standard.Cost do 
  use ExUnit.Case
  #@tag :pending

  test "standard cost" do
    bs =  %{
      type: "cover_or_minimum_purchase",
      data: %{
        cover: 5,
        minimum_purchase: %{
          type: "drink",
          data: 2
        },
      },
      perk: %{
        type: "minutes",
        data: 5
      }
    }

    cs = Standard.Cost.changeset(%Standard.Cost{}, bs)
    #IO.inspect cs
    assert cs.valid? == true
  end
end