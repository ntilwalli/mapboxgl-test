defmodule Test.Message.Listing.Query.Cuando do
  use ExUnit.Case

  test "Valid listing query donde" do
    {:ok, example_start} = Calendar.DateTime.from_naive(~N[2016-12-14T12:34:00.321], "America/New_York")
    {:ok, example_end} = Calendar.DateTime.from_naive(~N[2016-12-14T14:34:00.321], "America/New_York")  
    bs = %Listing.Query.Cuando{}
    cs = Listing.Query.Cuando.changeset(bs, %{
      "begins" => example_start, 
      "ends" => example_end
    })
    
    assert cs.valid? == true
  end
end