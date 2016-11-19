defmodule Test.Model.Region do
  use ExUnit.Case

  alias Shared.Model.Region

  test "Valid badslava location generates valid changeset" do
    bs = %Region{}
    cs = Region.changeset(bs, %{
      "geotag" => %{
        "city" => "Memphis", 
        "state_abbr" => "TN"
      }, 
      "position" => %{
        "lat" => 35.14952770700046, 
        "lng" => -90.04897680699969
      }
    })
    
    assert cs.valid? == true
  end
end