defmodule Test.TimezoneManager do
  use ExUnit.Case, async: true

  alias Shared.TimezoneManager
  test "timezone is properly returned from manager" do
    new_york = {-74.0059, 40.7128}
    tz = TimezoneManager.get(new_york)
    assert tz == "America/New_York"
  end
  test "The Ahh Noo Mic location" do
    new_york = {-73.9787077, 40.7294217}
    tz = TimezoneManager.get(new_york)
    assert tz == "America/New_York"
  end
end