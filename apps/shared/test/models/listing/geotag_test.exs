defmodule Test.Model.Geotag do
  use ExUnit.Case

  alias Shared.Model.Geotag

  test "Valid badslava location generates valid changeset" do
    bs = %Geotag{}
    cs = Geotag.changeset(bs, %{
      "city" => "Memphis", 
      "state_abbr" => "TN"
    })

    assert cs.valid? == true
  end
end