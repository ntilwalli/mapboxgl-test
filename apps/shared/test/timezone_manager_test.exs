defmodule Test.TimezoneManager do
  use ExUnit.Case, async: true

  alias Shared.Manager.TimezoneManager
  test "timezone is properly returned from manager" do
    new_york = {-74.0059, 40.7128}
    tz = TimezoneManager.get(new_york)
    assert tz == "America/New_York"
  end
end