defmodule Test.Listing.Registry do
  require Logger
  use ExUnit.Case, async: true

  setup do
    Listing.Worker.Supervisor.start_link
    {:ok, registry} = Listing.Registry.start_link(Listing.Registry)
    {:ok, registry: registry}
  end

  #@tag :pending
  test "returns :error for invalid listing id" , %{registry: registry} do
    assert Listing.Registry.lookup(registry, 1) == :error
  end

  test "adds a listing to registry", %{registry: registry} do
    parent_listing = %{
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

    {:ok, listing} = Listing.Registry.add(registry, parent_listing)
    assert !is_nil(listing.id)
  end
end