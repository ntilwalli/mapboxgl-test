defmodule LngLatTest do
  use ExUnit.Case

  alias Shared.Model.LngLat
  test "Valid lng/lat vals generate valid changeset" do
    cs = LngLat.changeset(%LngLat{}, %{
      "lng" => -74.0059,
      "lat" => 40.7128
    })

    assert cs.valid? == true
    assert cs.changes.timezone == "America/New_York"
  end

  test "Invalid lat vals generate valid changeset" do
    cs = LngLat.changeset(%LngLat{}, %{
      "lat" => 245.4343,
      "lng" => 23.843
    })

    refute cs.valid? == true
  end

  test "Invalid lng vals generate valid changeset" do
    cs = LngLat.changeset(%LngLat{}, %{
      "lat" => 45.4343,
      "lng" => 223.843
    })

    refute cs.valid? == true
  end
end