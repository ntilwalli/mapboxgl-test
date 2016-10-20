defmodule Test.Listing.ListingManager do
  use ExUnit.Case

  @tag :pending
  test "stuff" do
    val = %{
      "flag" => "blah",
      # "foo" => Timex.now()
      "foo" => %{
        "bar" => Timex.now()
      }
    }

    cs = Shared.TestDateTime.changeset(%Shared.TestDateTime{}, val)
    Shared.Repo.insert(cs)
    assert 1 = 1
  end
end