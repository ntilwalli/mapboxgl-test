defmodule Test.Badslava do
  use ExUnit.Case

  alias Listing.Location.Badslava

  test "Valid badslava location generates valid changeset" do
    bs = %Badslava{}
    cs = Badslava.changeset(bs, %{
      "street" => "something",
      "city" => "chicago",
      "stateAbbr" => "IL",
      "name" => "some venue name",
      "lng_lat" => %{
        "lng" => -74.0059,
        "lat" => 40.7128
      }
    })

    assert cs.valid? == true
  end

  test "Missing parameters generates invalid changeset" do
    bs = %Badslava{}
    cs = Badslava.changeset(bs, %{
      "street" => "something",
      "city" => "chicago",
      "stateAbbr" => "IL",
      "lng_lat" => %{
        "lng" => -74.0059,
        "lat" => 40.7128
      }
    })

    refute cs.valid? == true
  end


end