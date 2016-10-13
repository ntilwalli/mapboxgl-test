defmodule SharedTest do
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
    user = Repo.get!(User, 1)
    listing = %Listing{
      type: "single",
      profile: %{
        "meta" => %{
          "visibility" => "public"
        }
      }
    }

    info = ListingManager.add(listing, "saved", user)
    assert Map.get(info, :type) == "created"
    data = Map.get(info, :data)
    ListingManager.delete(data.id)
    data = Repo.get(Listing, data.id)
    assert is_nil(data)
  end

  test "add child listing" do
    user = Repo.get!(User, 1)
    parent_listing = %Listing{
      type: "single",
      profile: %{
        "meta" => %{
          "visibility" => "public"
        }
      }
    }

    parent_info = ListingManager.add(parent_listing, "saved", user)
    assert Map.get(parent_info, :type) == "created"
    parent_data = Map.get(parent_info, :data)
    parent_id = parent_data.id

    child_listing = %Listing{
      type: "single",
      parent_id: parent_id,
      profile: %{
        "meta" => %{
          "visibility" => "public"
        }
      }
    }

    child_info = ListingManager.add(child_listing, "saved", user)
    assert Map.get(child_info, :type) == "created"
    child_data= Map.get(child_info, :data)
    assert Map.get(child_data, :parent_id) === parent_id
    child_id = child_data.id
    ListingManager.delete(parent_id)
    parent_deleted = Repo.get(Listing, parent_id)
    assert is_nil(parent_deleted)
    child_deleted = Repo.get(Listing, child_id)
    assert is_nil(child_deleted)
  end
end
