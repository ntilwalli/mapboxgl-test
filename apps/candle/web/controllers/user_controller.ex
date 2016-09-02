defmodule Candle.UserController do
  use Candle.Web, :controller
  plug Ueberauth

  alias Candle.Auth.Helpers

  def route(conn, %{"route" => _, "data" => _} = params, current_user, _claims) do
    IO.puts "Routed to user controller"
    user = Helpers.get_user(conn, current_user)
    case User.Router.route(User.Router, {user, params}) do
      {:ok, response} ->
        IO.puts "Ok route"
        conn
        |> render("route.json", %{message: response})
      {:error, response} ->
        conn
        |> render("route.json", %{message: response})
    end
  end

  def route(conn, params, current_user, _claims) do
    IO.puts "Routed to user controller default"
    IO.inspect params
    conn
    |> render("route.json", %{message: %{type: "success"}})
  end
end