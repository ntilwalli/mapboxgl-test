defmodule Candle.UserController do
  use Candle.Web, :controller
  plug Ueberauth
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Model.Search.Query

  def route(conn, %{"route" => "/search", "data" => query} = params, current_user, _claims) do
    IO.puts "Routed to user controller"
    IO.inspect params
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
            IO.inspect response
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