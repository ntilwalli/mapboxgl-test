defmodule Test.Listing.DateTime.Recurring do
  use ExUnit.Case

  alias Listing.DateTime.Recurring
  test "recurring changeset, rdate only" do

    cs = Recurring.changeset(%Recurring{}, %{
      "rdate" => "stuff"
    })

    assert cs.valid? == true
  end

  test "recurring changeset, rrule only" do

    cs = Recurring.changeset(%Recurring{}, %{
      "rrule" => "stuff"
    })

    assert cs.valid? == true
  end

  test "recurring changeset, invalid" do

    cs = Recurring.changeset(%Recurring{}, %{
      "blah" => "stuff"
    })

    refute cs.valid? == true
  end

  test "recurring changeset, both rrule/rdate" do

    cs = Recurring.changeset(%Recurring{}, %{
      "rdate" => "stuff",
      "rrule" => "more",
      "exdate" => "panda"
    })

    assert cs.valid? == true
  end
end