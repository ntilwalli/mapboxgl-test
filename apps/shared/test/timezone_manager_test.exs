defmodule Test.TimezoneManager do
  use ExUnit.Case

  alias Shared.Manager.Timezone
  test "timezone is properly returned from manager" do
    new_york = {-74.0059, 40.7128}
    tz = Timezone.get(new_york)
    assert tz == "America/New_York"
  end
end