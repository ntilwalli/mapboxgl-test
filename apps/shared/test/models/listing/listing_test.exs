defmodule Test.Listing do
  use ExUnit.Case

  alias Shared.Listing

  test "listing changeset" do
    listing = %{
      "type" => "badslava_recurring",
      "visibility" => "public",
      "release" => "posted",
      "where" => %{
        "street" => "something",
        "city" => "chicago",
        "state_abbr" => "IL",
        "name" => "some venue name",
        "lng_lat" => %{
          "lng" => -74.0059,
          "lat" => 40.7128
        }
      },
      "when" => %{
        "frequency" => "weekly",
        "on" => "Monday",
        "start_time" => ~T[08:00:00.00]
      }
    }

    cs = Listing.changeset(%Listing{user_id: 1}, listing)
    assert cs.valid? == true
  end

  test "invalid listing changeset" do
    listing = %{
      "type" => "blah",
      "visibility" => "public",
      "release" => "posted",
      "where" => %{
        "street" => "something",
        "city" => "chicago",
        "state_abbr" => "IL",
        "name" => "some venue name",
        "lng_lat" => %{
          "lng" => -74.0059,
          "lat" => 40.7128
        }
      },
      "when" => %{
        "frequency" => "weekly",
        "on" => "Monday",
        "start_time" => ~T[08:00:00.00]
      }
    }

    cs = Listing.changeset(%Listing{user_id: 1}, listing)
    refute cs.valid? == true
  end
end