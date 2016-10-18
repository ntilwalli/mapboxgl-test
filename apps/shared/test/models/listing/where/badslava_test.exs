defmodule Test.Badslava do
  use ExUnit.Case

  alias Shared.Model.Listing.Where.Badslava

  test "Valid badslava location generates valid changeset" do
    bs = %Badslava{}
    cs = Badslava.changeset(bs, %{
      "street" => "something",
      "city" => "chicago",
      "state_abbr" => "IL",
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
      "state_abbr" => "IL",
      "lng_lat" => %{
        "lng" => -74.0059,
        "lat" => 40.7128
      }
    })

    refute cs.valid? == true
  end


end