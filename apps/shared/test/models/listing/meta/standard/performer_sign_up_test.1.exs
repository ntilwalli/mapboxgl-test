 defmodule Test.Standard.PerformerCheckIn do 
  use ExUnit.Case
  #@tag :pending

  test "standard sign up" do
    bs =  %{
      data: %{
        in_person: %{
          begins: nil, 
          ends: nil,
          styles: ["list"]
        }
      }, 
      type: "in_person"
    }

    cs = Standard.PerformerSignUp.changeset(%Standard.PerformerSignUp{}, bs)
    IO.inspect cs
    assert cs.valid? == true
  end
end