defmodule Test.Shared.Manager.ListingManagerTest do
  use ExUnit.Case
  #use Timex
  #doctest Shared

  #alias Timex
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

    {status, data} = foo = ListingManager.add(listing, user)
    #IO.inspect foo
    assert status == :ok
    ListingManager.delete(data.id)
    data = Repo.get(Shared.Listing, data.id)
    assert is_nil(data)
  end

  #@tag :pending
  test "add child listing" do
    user = Repo.get!(User, 0)
    parent_listing = %{
      "type" => "recurring",
      "visibility" => "public",
      "release" => "posted",
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

    {status, parent_data} = parent_info = ListingManager.add(parent_listing, user)
    #IO.inspect parent_info
    assert status == :ok
    parent_id = parent_data.id

    child_listing = %{
      "parent_id" => parent_id,
      "type" => "single",
      "visibility" => "public",
      "release" => "posted",
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
        "start" => Calendar.DateTime.now! "America/New_York"
      },
      "meta" => %{
        "type" => "badslava",
        "sign_up" => %{
          "start" => -15,
          "styles" => ["list"],
          "methods" => [%{
            "type" => "email_with_upgrades", 
            "data" => %{
              "type" => "additional_stage_time",
              "data" => 1
            }
            }, %{
              "type" => "walk_in"
            }]
        },
        "check_in" => %{
          "end" => -15,
        },
        "cost" => %{
          "type" => "free_plus_upgrades",
          "data" => %{
            "upgrades" => [%{
              "type" => %{
                "type" => "pay",
                "data" => 2
              },
              "item" => %{
                "type" => "additional_stage_time",
                "data" => 1
              }
            }]
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
