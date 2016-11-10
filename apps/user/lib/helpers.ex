defmodule User.Helpers do
  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Shared.Macro.GeoGeography
  alias Shared.Repo
  alias Shared.Message.Search.Query, as: SearchQuery

  def search(%SearchQuery{} = query) do
    %SearchQuery{begins: begins, ends: ends, center: %{lng: lng, lat: lat}, radius: radius} = query
    point = %Geo.Point{coordinates: {lng, lat}, srid: 4326}
    query = from s in Shared.SingleListingSearch,
        preload: :listing,
        where: st_dwithin_geog(s.geom, ^point, ^radius) and 
          s.begins >= ^begins and 
          s.begins <= ^ends,
        #order_by: [asc: fragment("1")],
        select: {st_distance_geog(s.geom, ^point), s}

    results = Repo.all(query)
    listings = for {distance, sls} <- results, do: %{distance: distance, listing: sls.listing}
    listings
  end
end