 defmodule Test.Listing.Meta.Badslava do 
  use ExUnit.Case

  alias Shared.Model.Listing.Meta.Badslava, as: BadslavaEvent

  #@tag :pending
  test "meta badslava changeset" do
    bs = %{
      "type" => "badslava",
      "sign_up" => %{
        "start" => ~N[2016-11-12 19:45:00],
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
        "end" => ~N[2016-11-12 19:45:00],
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

    cs = BadslavaEvent.changeset(%BadslavaEvent{}, bs)
    assert cs.valid? == true
  end

end