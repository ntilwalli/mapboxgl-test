defmodule User.Helpers do
  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Shared.Macro.GeoGeography
  alias Shared.Repo
  alias Shared.Message.Search.Query, as: SearchQuery

  def gather_listings_info(query, user, listing_registry) do
    search_results = search(query, user)
    listings_info =
      for l <- search_results do
        {:ok, pid} = Listing.Registry.lookup(listing_registry, l.listing_id)
        {:ok, result} = Listing.Worker.retrieve(pid, user)
        result
      end

    listings_info
  end

  def search(%SearchQuery{} = query, user) do
    %SearchQuery{begins: begins, ends: ends, center: %{lng: lng, lat: lat}, radius: radius} = query
    point = %Geo.Point{coordinates: {lng, lat}, srid: 4326}
    query = from s in Shared.SingleListingSearch,
        preload: :listing,
        where: st_dwithin_geog(s.geom, ^point, ^radius) and 
          s.begins >= ^begins and 
          s.begins <= ^ends,
        select: s

    out = Repo.all(query)
    out
  end

  # def search(%SearchQuery{} = query) do
  #   %SearchQuery{begins: begins, ends: ends, center: %{lng: lng, lat: lat}, radius: radius} = query
  #   point = %Geo.Point{coordinates: {lng, lat}, srid: 4326}
  #   query = from s in Shared.SingleListingSearch,
  #       preload: :listing,
  #       where: st_dwithin_geog(s.geom, ^point, ^radius) and 
  #         s.begins >= ^begins and 
  #         s.begins <= ^ends,
  #       #order_by: [asc: fragment("1")],
  #       select: {st_distance_geog(s.geom, ^point), s}

  #   results = Repo.all(query)
  #   listings = for {distance, sls} <- results, do: %{distance: distance, listing: sls.listing}
  #   listings
  # end

end