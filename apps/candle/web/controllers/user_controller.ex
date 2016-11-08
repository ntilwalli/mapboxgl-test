defmodule Candle.UserController do
  use Candle.Web, :controller
  plug Ueberauth
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Model.Search.Query

  def geotag(conn, %{"lat" => lat, "lng" => lng} = params, _current_user, _claims) do
    IO.inspect params
    geo_tag_url = "https://api.factual.com/geotag"
    factual_key = "99aLr5p8dp2AjzpGNGLMpc4NTWJx07UWbKl34ALW"
    url = "#{geo_tag_url}?latitude=#{lat}&longitude=#{lng}&KEY=#{factual_key}"
    #IO.inspect url
    resp = HTTPoison.get! url
    body = resp.body
    #IO.inspect body
    conn
    |> render("route.json", message: %{type: "success", data: body})
  end

  def timezone(conn, %{"lat": lat, "lng": lng} = params, _current_user, _claims) do
    conn
    |> render("route.json", message: %{type: "success", data: "timezone"})
  end

  def route(conn, %{"route" => "/search", "data" => query} = params, current_user, _claims) do
    #IO.puts "Routed to user controller"
    #IO.inspect params
    user = Helpers.get_user(conn, current_user)

    cs = Query.changeset(%Query{}, query)
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

  # def route(conn, params, current_user, _claims) do
  #   IO.puts "Routed to user controller default"
  #   IO.inspect params
  #   conn
  #   |> render("route.json", %{message: %{type: "success"}})
  # end
end