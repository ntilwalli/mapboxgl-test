defmodule Test.Message.Listing.Query.Meta do
  use ExUnit.Case

  test "Valid listing query meta" do
    bs = %Listing.Query.Meta{}
    cs = Listing.Query.Meta.changeset(bs, %{
      "categories" => [], 
      "event_types" => []
    })
    
    #IO.inspect cs
    assert cs.valid? == true
  end
end