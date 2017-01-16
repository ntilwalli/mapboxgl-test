defmodule User.Helpers do
  import Ecto.Changeset, only: [apply_changes: 1]
  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Shared.Macro.GeoGeography
  
  alias Shared.Repo
  alias Shared.Message.Incoming.Search.Query, as: SearchQueryMessage
  alias Shared.Message.DateTimeRange, as: DateTimeRangeMessage
  alias Shared.Message.Outgoing.Home.CheckIns, as: CheckInsMessage
  alias Shared.Message.Outgoing.CheckIn, as: CheckInItem
  alias Shared.Model.Once, as: CuandoOnce

  alias Shared.ListingSession
  def gather_check_ins(
    %DateTimeRangeMessage{begins: begins, ends: ends}, 
    %Shared.User{id: user_id}
  ) do
    query = from s in Shared.CheckIn,
        preload: :listing,
        where: s.user_id == ^user_id and 
          s.inserted_at >= ^begins and 
          s.inserted_at <= ^ends,
        select: s

    # IO.puts "gather_check_ins..."
    # IO.inspect query

    results = Repo.all(query)
  
    out =
      for c <- results do
        cuando_map = c.listing.cuando
        cs = CuandoOnce.changeset(%CuandoOnce{}, cuando_map)
        cuando = apply_changes(cs)
        # IO.puts "Check-in cuando..."
        # IO.inspect cuando
        %CheckInItem{
          listing_id: c.listing_id, 
          check_in_datetime: c.inserted_at,
          listing_name: c.listing.name,
          listing_datetime: cuando.begins
        }
      end

    %CheckInsMessage{check_ins: out}
  end

  def gather_listings_info(query, user, listing_registry) do
    IO.inspect {:query, query}
    search_results = search(query, user)
    #IO.inspect {:search_results, search_results}
    listings_info =
      for l <- search_results do
        {:ok, pid} = Listing.Registry.lookup(listing_registry, l.listing_id)
        {:ok, result} = Listing.Worker.retrieve(pid, user)
        #IO.inspect {:gather_result, result}
        result
      end

    listings_info
  end

  def search(%SearchQueryMessage{} = query, user) do
    %SearchQueryMessage{begins: begins, ends: ends, center: %{lng: lng, lat: lat}, radius: radius} = query
    point = %Geo.Point{coordinates: {lng, lat}, srid: 4326}
    query = from s in Shared.SingleListingSearch,
        preload: :listing,
        where: st_dwithin_geog(s.geom, ^point, ^radius) and 
          s.begins >= ^begins and 
          s.begins <= ^ends,
        select: s

    #IO.inspect {:query, query}

    out = Repo.all(query)
    # IO.puts "search query/out"
    # IO.inspect query
    # IO.inspect out
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


  def gather_listing_sessions(
    # %DateTimeRangeMessage{dtstart: begins, dtend: ends}, 
    %Shared.User{id: user_id}
  ) do
    query = from s in Shared.ListingSession,
        where: s.user_id == ^user_id,
        select: s

    IO.puts "gather_listing_sessions..."
    IO.inspect query

    results = Repo.all(query)
    IO.inspect {:user_sessions, results}
    results
  end

  def gather_listings(%Shared.User{id: user_id}, release_type) do
    query = from s in Shared.Listing,
        where: s.user_id == ^user_id and
          s.release == ^release_type,
        select: s

    IO.puts "gather " <> release_type <> " listings..."
    IO.inspect query

    results = Repo.all(query)
    IO.inspect {:user_listings, results}
    results
  end
end