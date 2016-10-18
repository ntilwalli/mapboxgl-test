defmodule Test.ListingManager do
  use ExUnit.Case
  #doctest Shared

  alias Shared.Listing
  alias Shared.User
  alias Shared.Repo
  alias Shared.ListingManager

  setup do
    Application.stop(:shared)
    :ok = Application.start(:shared)
  end

  test "add user (default) listing" do
    IO.puts "Listing manager test"
    user = Repo.get!(User, 1)
    listing = %{
      "type" => "badslava",
      "visibility" => "public",
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

    info = ListingManager.add(listing, "posted", user)
    assert info.type == "created"
    data = info.data
    ListingManager.delete(data.id)
    data = Repo.get(Listing, data.id)
    assert is_nil(data)
  end

  test "add child listing" do
    user = Repo.get!(User, 1)
    parent_listing = %{
      "type" => "badslava",
      "visibility" => "public",
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

    parent_info = ListingManager.add(parent_listing, "posted", user)
    assert Map.get(parent_info, :type) == "created"
    parent_data = parent_info.data
    parent_id = parent_data.id

    child_listing = %{
      "parent_id" => parent_id,
      "type" => "badslava",
      "visibility" => "public",
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

    child_info = ListingManager.add(child_listing, "staged", user)
    assert Map.get(child_info, :type) == "created"
    child_data= Map.get(child_info, :data)
    assert child_data.parent_id === parent_id
    child_id = child_data.id
    ListingManager.delete(parent_id)
    parent_deleted = Repo.get(Listing, parent_id)
    assert is_nil(parent_deleted)
    child_deleted = Repo.get(Listing, child_id)
    assert is_nil(child_deleted)
  end
end
