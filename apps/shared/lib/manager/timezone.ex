defmodule Shared.Manager.Timezone do
  import Ecto.Query, only: [from: 2, first: 1]
  import Geo.PostGIS

  alias Shared.Repo
  alias Geo.Point
  alias Shared.TzWorld
  alias Shared.Model.LngLat

  def get({lng, lat} = coordinates) when is_number(lng) and is_number(lat) do
    point = %Geo.Point{coordinates: coordinates, srid: 4326}
    query = from location in TzWorld,
      where: st_intersects(^point, location.geom),
      select: location.tzid

    Repo.one(query)
  end
end