defmodule Test.ListingManager do
  use ExUnit.Case
  #doctest Shared

  alias Shared.Listing
  alias Shared.User
  alias Shared.Repo
  alias Shared.ListingManager
  # alias Shared.ListingSession
  # alias Shared.ListingSessionManager
  alias Listing.Location.Badslava
  alias Listing.DateTime.Badslava

  setup do
    Application.stop(:shared)
    :ok = Application.start(:shared)
  end

  # test "add listing session" do
  #   user = Repo.get!(User, 1)
  #   # IO.inspect(user)
  #   listing = %{
  #     "type" => "single",
  #     "visibility" =>  "public",
  #     "profile" => %{}
  #   }
  #   session = %{
  #     "listing" => listing
  #   }

  #   info = ListingSessionManager.add(session, user)
  #   assert info.type == "created"
  # end
end