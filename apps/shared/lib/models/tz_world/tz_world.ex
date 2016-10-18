defmodule Shared.TzWorld do
  use Shared.Lib, :model

  @primary_key false
  schema "tz_world" do
    field :field, :integer
    field :tzid, :string
    field :geom, Geo.Geometry
  end
end