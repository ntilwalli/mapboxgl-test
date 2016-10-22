defmodule Shared.Manager.TimezoneManager do
  import Ecto.Query, only: [from: 2]
  import Geo.PostGIS

  alias Shared.Repo
  alias Shared.TzWorld

  def get({lng, lat} = coordinates) when is_number(lng) and is_number(lat) do
    point = %Geo.Point{coordinates: coordinates, srid: 4326}
    query = from location in Shared.TzWorld,
      where: st_intersects(^point, location.geom),
      select: location.tzid

    case Shared.Repo.one(query) do
      nil -> 
        query = from l in Shared.TzWorld,
          select: l.tzid,
          order_by: [asc: st_distance(l.geom, ^point)],
          limit: 1
        Shared.Repo.one(query)
      val -> val
    end
  end
end