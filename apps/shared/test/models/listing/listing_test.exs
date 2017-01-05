defmodule Test.Listing do
  use ExUnit.Case

  alias Shared.Listing

  test "listing changeset" do
    listing = %{
      "type" => "recurring",
      "name" => "blah",
      "event_types" => ["open-mic"],
      "categories" => ["comedy"],
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
      "name" => "blah",
      "event_types" => ["open-mic"],
      "categories" => ["comedy"],
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

  #@tag :pending
  test "add new type of listing" do
    listing = %{
      cuando: %{
        exdate: [], 
        rdate: [], 
        rrules: [%{
          bysetpos: [1], 
          byweekday: ["thursday"], 
          dtstart: ~N[2017-01-05 19:00:00], 
          freq: "monthly"
        }]
      }, 
      donde: %{
        city: "Brooklyn", 
        lng_lat: %{
          lat: 40.67845, 
          lng: -73.9104471
        }, 
        name: "Armond's Lounge", 
        state_abbr: "NY", 
        street: "2065 Fulton Street", 
        type: "badslava"
      }, 
      meta: %{
        categories: ["comedy"], 
        contact_info: %{
          email: "melgarlick719@gmail.com", 
          phone: "(718) 356-7039"
        }, 
        event_types: ["open_mic"], 
        listed_hosts: [], 
        name: "Thirsty Thursdays Of Laffs (STARTS 12/15/16)", 
        note: "STARTS 12/15/16. Free to perform, Free to watch, Sign up: 7PM Start time: 7:30PM One drink purchase to peform, 6 minute set", 
        performer_check_in: nil, 
        performer_cost: [
          %{data: nil, type: "free"}, 
          %{data: %{
            minimum_purchase: %{data: 1, type: "drink"}}, 
            perk: %{data: 6, type: "minutes"}, 
            type: "minimum_purchase"
          }
        ], 
        performer_limit: nil, 
        performer_sign_up: nil, 
        stage_time: [], 
        type: "standard"
      }, 
      release: "posted", 
      settings: %{
        check_in: %{
          begins: %{
            data: %{minutes: 30}, 
            type: "minutes_before_event_start"
          }, 
          ends: %{type: "event_end"}, 
          radius: 30
        }
      }, 
      source: "badslava", 
      type: "recurring", 
      visibility: "public"
    }

    cs = Listing.changeset(%Listing{user_id: 1}, listing)
    assert cs.valid? == true
  end


end