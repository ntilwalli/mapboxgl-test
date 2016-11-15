defmodule Candle.UserController do
  use Candle.Web, :controller
  plug Ueberauth
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Message.LngLat, as: LngLatMessage
  alias Shared.Model.LngLat, as: LngLatModel
  
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

  def route(conn, %{"route" => route, "data" => message}, current_user, _claims) do
    response = 
      case current_user do
        nil -> 
          #IO.puts "Anonymous"
          {:ok, pid} = User.Registry.lookup_anonymous(User.Registry, conn.cookies["aid"])
          User.Anon.route(pid, route, message)
        _ -> 
          #IO.puts "User"
          {:ok, pid} = User.Registry.lookup_user(User.Registry, current_user)
          User.Auth.route(pid, route, message)
      end

    case response do
      {:ok, message} ->
        render(conn, "route.json", message: %{type: "success", data: message})
      {:error, message} -> 
        render(conn, "route.json", message: %{type: "error", data: message})
    end
  end

  def route(conn, %{"route" => route}, current_user, _claims) do
    response = 
      case current_user do
        nil -> 
          #IO.puts "Anonymous"
          {:ok, pid} = User.Registry.lookup_anonymous(User.Registry, conn.cookies["aid"])
          User.Anon.route(pid, route)
        _ -> 
          #IO.puts "User"
          {:ok, pid} = User.Registry.lookup_user(User.Registry, current_user)
          User.Auth.route(pid, route)
      end

    case response do
      {:ok, message} ->
        render(conn, "route.json", message: %{type: "success", data: message})
      {:error, message} -> 
        render(conn, "route.json", message: %{type: "error", data: message})
    end
  end

end