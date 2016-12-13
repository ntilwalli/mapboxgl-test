 defmodule Test.Listing.Meta.Badslava do 
  use ExUnit.Case

  alias Shared.Model.Listing.Meta.Badslava
  #Shared.Model.Listing.Meta.Badslava

  #@tag :pending
  test "meta badslava changeset" do
    bs = %{
      "type" => "badslava",
      "name" => "blah",
      "event_types" => ["open-mic"],
      "categories" => ["comedy"],
      "sign_up" => %{
        "begins" => -15,
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
        "ends" => -15,
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

    cs = Badslava.changeset(%Badslava{}, bs)
    assert cs.valid? == true
  end

end