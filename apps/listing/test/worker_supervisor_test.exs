defmodule Test.Listing.Worker.Supervisor do
  use ExUnit.Case

  @moduletag :unit

  setup do
    {:ok, w_sup} = Listing.Worker.Supervisor.start_link(TestSupervisor)
    {:ok, registry} = Listing.Registry.start_link(TestRegistry, TestSupervisor)
    {:ok, registry: registry, worker_supervisor: w_sup}
  end

  test "stuff", %{registry: registry, worker_supervisor: w_sup} do

    user = Shared.Repo.get!(Shared.User, 0)
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

    {_status, listing} = Shared.Manager.ListingManager.add(listing, user)
    {status, _pid} = _info = Listing.Worker.Supervisor.start_worker(w_sup, listing, registry)
    # IO.inspect info
    assert status == :ok
    #assert 1 == 1
  end
end