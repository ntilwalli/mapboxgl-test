defmodule Candle.UserController do
  use Candle.Web, :controller
  plug Ueberauth
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Message.LngLat, as: LngLatMessage
  alias Shared.Model.LngLat, as: LngLatModel

  alias Incoming.Authorization.ForgottenPassword
  
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

  def forgotten_password(conn, params, _current_user, _claims) do
    cs = ForgottenPassword.changeset(%ForgottenPassword{}, params)
    msg = apply_changes(cs)
    response = Auth.Manager.forgotten_password(Auth.Manager, msg)

    case response do
      :ok ->
        render(conn, "route.json", message: %{type: "success", data: nil})
      {:error, message} -> 
        render(conn, "route.json", message: %{type: "error", data: message})
    end
  end

  def route(conn, %{"route" => route, "data" => message}, current_user, _claims) do
    response = 
      case current_user do
        nil -> 
          #IO.puts "Anonymous"
          aid = conn.cookies["aid"]
          IO.inspect {:anon_route_w_message, route, message}
          User.Anon.route(aid, route, message)
        _ -> 
          #IO.puts "User"
          IO.inspect {:user_route_w_message, route, message}
          User.Individual.route(current_user, route, message)
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
          IO.inspect {:anonymous_route, route}
          aid = conn.cookies["aid"]
          User.Anon.route(aid, route)
        _ -> 
          #IO.puts "User"
          IO.inspect {:user_route, route}
          out = User.Individual.route(current_user, route)
          #IO.inspect {:out, out}
          out
      end

    case response do
      {:ok, message} ->
        render(conn, "route.json", message: %{type: "success", data: message})
      {:error, message} -> 
        render(conn, "route.json", message: %{type: "error", data: message})
    end
  end

end