defmodule Test.TestFoo do
  use ExUnit.Case
  #use Timex
  #doctest Shared

  alias Timex
  alias Shared.User
  alias Shared.Repo
  alias Shared.Manager.ListingManager

  setup do
    Application.stop(:shared)
    :ok = Application.start(:shared)
  end

  #@tag :pending
  test "add user (default) listing" do
    user = Repo.get!(User, 0)
    time = ~T[08:00:00.00]
    #val = Time.to_iso8601(time)
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
        "start_time" => time
      }
    }

    {status, data} = ListingManager.add(listing, user)
    assert status == :ok
    ListingManager.delete(data.id)
    data = Repo.get(Shared.Listing, data.id)
    assert is_nil(data)
  end

  #@tag :pending
  test "add child listing" do
    user = Repo.get!(User, 0)
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

    {status, parent_data} = parent_info = ListingManager.add(parent_listing, user)
    assert status == :ok
    parent_id = parent_data.id

    child_listing = %{
      "parent_id" => parent_id,
      "type" => "badslava_single",
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
        "start" => Timex.now()
      }
    }

    {child_status, child_data} = ListingManager.add(child_listing, user)
    assert child_status == :ok
    assert child_data.parent_id === parent_id
    child_id = child_data.id
    ListingManager.delete(parent_id)
    parent_deleted = Repo.get(Shared.Listing, parent_id)
    assert is_nil(parent_deleted)
    child_deleted = Repo.get(Shared.Listing, child_id)
    assert is_nil(child_deleted)
  end
end
