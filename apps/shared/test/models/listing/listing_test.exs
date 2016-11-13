defmodule Test.Listing do
  use ExUnit.Case

  alias Shared.Listing

  test "listing changeset" do
    listing = %{
      "type" => "recurring",
      "visibility" => "public",
      "release" => "posted",
      "donde" => %{
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
      "cuando" => %{
        "rrule" => %{
          "freq" => "weekly",
        }
      },
      "meta" => %{
        "type" => "badslava",
        "sign_up" => %{
          "begins" => -15,
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
          "begins" => -10,
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
      },
      "settings" => %{},
      "categories" => ["comedy"],
      "event_types" => ["open-mic", "show"]
    }

    cs = Listing.changeset(%Listing{user_id: 1}, listing)
    #IO.inspect cs
    assert cs.valid? == true
  end

  test "invalid listing changeset" do
    listing = %{
      "type" => "blah",
      "visibility" => "public",
      "release" => "posted",
      "settings" => %{},
      "event_types" => ["open-mic", "show"],
      "categories" => ["comedy"],
      "donde" => %{
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
      "cuando" => %{
        "rrule" => %{
          "freq" => "weekly",
        }
      },
      "meta" => %{
        "type" => "badslava",
        "sign_up" => %{
          "begins" => ~T[19:45:00],
          "types" => ["bucket"],
          "website" => "http://something.com"
        },
        "check_in" => %{
          "ends" => ~T[19:45:00],
        },
        "cost" => %{
          "cover" => 5,
          "minimum" => 1,
          "has_free_option" => true
        },
        "contact_info" => %{
          "email" => "thing@t.com",
          "email_name" => "Thing guys"
        },
        "stage_time" => [5, 7],
        "performer_limit" => %{
          "max" => 25,
          "has_waitlist" => true,
          "waitlist_max" => 5
        },
        "note" => "Some note"
      }
    }

    cs = Listing.changeset(%Listing{user_id: 1}, listing)
    refute cs.valid? == true
  end
end