defmodule Test.Message.Listing.Query.Donde do
  use ExUnit.Case

  test "Valid listing query donde" do
    bs = %Listing.Query.Donde{}
    cs = Listing.Query.Donde.changeset(bs, %{
      "center" => %{
        "lat" => 12.0,
        "lng" => 12.0
      }, 
      "radius" => 12
    })
    
    #IO.inspect cs
    assert cs.valid? == true
  end
end