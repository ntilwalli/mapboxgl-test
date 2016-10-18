defmodule Test.Listing.DateTime.Once do
  use ExUnit.Case
  #import Timex
  alias Listing.DateTime.Once

  @example_start Timex.to_datetime(~N[2016-12-14T12:34:00.321])
  @example_end Timex.to_datetime(~N[2016-12-14T14:34:00.321])
  test "once changeset" do
    # IO.inspect @example_start
    # IO.inspect @example_end
    cs = Once.changeset(%Once{}, %{
      "start" => @example_start,
      "end" => @example_end
    })

    assert cs.valid? == true
  end
end