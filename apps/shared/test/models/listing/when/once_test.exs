defmodule Test.Listing.Cuando.Once do
  use ExUnit.Case
  #import Timex
  alias Shared.Model.Once


  test "once changeset" do
    {:ok, example_start} = Calendar.DateTime.from_naive(~N[2016-12-14T12:34:00.321], "America/New_York")
    {:ok, example_end} = Calendar.DateTime.from_naive(~N[2016-12-14T14:34:00.321], "America/New_York")  
    cs = Once.changeset(%Once{}, %{
      "begins" => example_start,
      "ends" => example_end
    })

    assert cs.valid? == true
  end
end