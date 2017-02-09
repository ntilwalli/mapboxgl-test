defmodule Test.Message.Listing.Query do
  use ExUnit.Case

  test "Valid listing query" do
    {:ok, example_start} = Calendar.DateTime.from_naive(~N[2016-12-14T12:34:00.321], "America/New_York")
    {:ok, example_end} = Calendar.DateTime.from_naive(~N[2016-12-14T14:34:00.321], "America/New_York")  

    bs = %Listing.Query{}
    cs = Listing.Query.changeset(bs, %{
      "parent_id" => 32,
      "cuando" => %{
        "begins" => example_start, 
        "ends" => example_end
      }
    })
    
    #IO.inspect cs
    assert cs.valid? == true
  end
end