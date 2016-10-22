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

    {_status, listing} = Shared.Manager.ListingManager.add(listing, user)
    {status, _pid} = _info = Listing.Worker.Supervisor.start_worker(w_sup, listing, registry)
    # IO.inspect info
    assert status == :ok
    #assert 1 == 1
  end
end