defmodule Test.Listing.Settings.Badslava do
  use ExUnit.Case

  alias Shared.Model.Listing.Settings.Badslava

  test "Valid badslava location generates valid changeset" do
    bs = %Badslava{}
    cs = Badslava.changeset(bs, %{
      "type" => "badslava",
      "check_in" => %{
        "begins" => -15,
        "ends" => nil,
        "radius" => 30
      }
    })

    #IO.inspect cs
    assert cs.valid? == true
  end

  # test "Missing parameters generates invalid changeset" do
  #   bs = %Badslava{}
  #   cs = Badslava.changeset(bs, %{
  #     "street" => "something",
  #     "city" => "chicago",
  #     "state_abbr" => "IL",
  #   })

  #   refute cs.valid? == true
  # end


end