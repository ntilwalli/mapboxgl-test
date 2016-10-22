defmodule Test.Listing.Registry do
  require Logger
  use ExUnit.Case

  test "returns :error for invalid listing id" do
    {status, _message} = Listing.Registry.lookup(Listing.Registry, 1)
    assert status == :error
  end

  test "adds a listing to registry" do
    user = Shared.Repo.get!(Shared.User, 0)
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

    {:ok, listing} = Listing.Registry.create(Listing.Registry, listing, user)
    assert !is_nil(listing.id)
    _info = Listing.Registry.delete(Listing.Registry, listing.id, user)
    assert :error == elem(Listing.Registry.lookup(Listing.Registry, Map.get(listing, :id)), 0)
  end
end