defmodule Candle.UserController do
  use Candle.Web, :controller
  plug Ueberauth
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Message.Search.Query, as: SearchQueryMessage
  alias Shared.Message.LngLat, as: LngLatMessage
  alias Shared.Model.LngLat, as: LngLatModel
  alias Shared.Message.Listing.CheckIn, as: CheckInMessage
  def geotag(conn, %{"lat" => lat, "lng" => lng} = params, _current_user, _claims) do
    cs = LngLatMessage.changeset(%LngLatMessage{}, params)
    case cs.valid? do
      true ->
        %{lng: lng, lat: lat} = apply_changes(cs) 
        geo_tag_url = "https://api.factual.com/geotag"
        factual_key = "99aLr5p8dp2AjzpGNGLMpc4NTWJx07UWbKl34ALW"
        url = "#{geo_tag_url}?latitude=#{lat}&longitude=#{lng}&KEY=#{factual_key}"
        #IO.inspect url
        resp = HTTPoison.get! url
        body = resp.body
        #IO.inspect body
        conn
        |> render("route.json", message: %{type: "success", data: body})
      false ->
        conn
        |> render("route.json", message: %{
          type: "error", 
          data: "Could not retrieve geotag, sent lng/lat (#{Float.to_string(lng)}/#{Float.to_string(lat)}) is invalid."
        })
    end
  end

  def timezone(conn, %{"lat": lat, "lng": lng} = params, _current_user, _claims) do
    cs = LngLatModel.changeset(%LngLatModel{}, params)
    case cs.valid? do
      true ->
        %{timezone: timezone} = apply_changes(cs)

        conn
        |> render("route.json", message: %{type: "success", data: timezone})
      false ->
        conn
        |> render("route.json", message: %{
          type: "error", 
          data: "Could not retrieve timezone, sent lng/lat (#{Float.to_string(lng)}/#{Float.to_string(lat)}) is invalid."
        })
    end
  end

  def route(conn, %{"route" => "/search", "data" => query} = params, current_user, _claims) do
    #IO.puts "Routed to user controller"
    #IO.inspect params
    user = Helpers.get_user(conn, current_user)

    cs = SearchQueryMessage.changeset(%SearchQueryMessage{}, query)
    case cs.valid? do
      true -> 
        q = apply_changes(cs)
        IO.puts "Query..."
        IO.inspect q
        case User.Registry.search(User.Registry, user, q) do
          {:ok, response} ->
            IO.puts "success"
            #IO.inspect response
            conn
            |> render("route.json", message: %{type: "success", data: response})
          {:error, response} ->
            IO.puts "error"
            IO.inspect response
            conn
            |> render("route.json", message: %{type: "error", data: response})
        end
      false -> 
        conn
        |> render("route.json", message: %{type: "error", data: %{type: "Invalid query", data: query}})
    end
  end

  def route(conn, %{"route" => "/retrieve_listing", "data" => listing_id} = params, current_user, _claims) do
    user = Helpers.get_user(conn, current_user)

    case Integer.parse(listing_id) do
      {whole, _} -> 
        {:ok, listing} = User.Registry.retrieve_listing(User.Registry, user, whole)
        conn
        |> render("route.json", message: %{type: "success", data: listing})
      :error ->
        conn
        |> render("route.json", message: %{type: "error", data: "Sent listing id (#{listing_id}) invalid."})
    end
  end

  def check_in(conn, params, current_user, _claims) do
    user = Helpers.get_user(conn, current_user)
    case user do
      %{user_id: user_id} -> 
        cs = CheckInMessage.changeset(%CheckInMessage{}, params)
          case cs.valid? do
            true -> 
              message = apply_changes(cs)
              message = Map.put(message, :user_id, user_id)
              IO.inspect message
              render(conn, "route.json", message: %{type: "success", data: message})
            _ -> 
              render(conn, "route.json", message: %{type: "error", data: "Check-in message is invalid"})
          end
      _ -> 
        render(conn, "route.json", message: %{type: "error", data: "User must be authenticated to check-in"})
    end
  end

end