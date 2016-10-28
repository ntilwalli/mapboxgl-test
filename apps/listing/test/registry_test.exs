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
      "type" => "recurring",
      "visibility" => "public",
      "release" => "posted",
      "categories" => ["comedy", "open_mic"],
      "where" => %{
        "type" => "badslava",
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
        "rrule" => %{
          "freq" => "weekly",
        }
      },
      "meta" => %{
        "type" => "badslava",
        "sign_up" => %{
          "start" => -15,
          "styles" => ["list"],
          "methods" => [%{
            "type" => "email_with_upgrade", 
            "data" => %{
              "type" => "additional_stage_time",
              "data" => 1
            }
            }, %{
              "type" => "walk_in"
            }]
        },
        "check_in" => %{
          "start" => -10,
        },
        "cost" => %{
          "type" => "free_plus_upgrade",
          "data" => %{
            "cost" => %{
              "type" => "pay",
              "data" => 2
            },
            "data" => %{
              "type" => "additional_stage_time",
              "data" => 1
            }
          }
        },
        "contact" => %{
          "email" => "thing@t.com",
          "email_name" => "Thing guys",
          "website" => "http://something.com"
        },
        "stage_time" => [%{"type" => "max", "data" => 5}, %{"type" => "range", "data" => [3, 5]}],
        "performer_limit" => %{
          "type" => "limit_with_waitlist",
          "data" => %{
            "limit" => 25,
            "waitlist" => 5
          }
        },
        "host" => ["Sally Shah", "Rajiv Khanna"],
        "note" => "Some note"
      } 
    }

    {:ok, listing} = Listing.Registry.create(Listing.Registry, listing, user)
    assert !is_nil(listing.id)
    _info = Listing.Registry.delete(Listing.Registry, listing.id, user)
    assert :error == elem(Listing.Registry.lookup(Listing.Registry, Map.get(listing, :id)), 0)
  end
end