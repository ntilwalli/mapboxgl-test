defmodule Test.Listing.When.Badslava do
  use ExUnit.Case

  alias Shared.Model.Listing.When.Badslava
  test "badslava date_time changeset" do

    cs = Badslava.changeset(%Badslava{}, %{
      "frequency" => "weekly",
      "on" => "Monday",
      "start_time" => ~T[08:00:00.00]
    })

    assert cs.valid? == true
  end
end