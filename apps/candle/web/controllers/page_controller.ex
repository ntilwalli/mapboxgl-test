defmodule Candle.PageController do
  use Candle.Web, :controller
  plug :put_layout, false

  require Logger

  alias Candle.Auth.Helpers

  def index(conn, _params, current_user, _claims) do
    case current_user do
      nil ->
        anonymous_id = 
          case Map.get(conn.cookies, "aid") do
            nil -> to_string(Ecto.UUID.autogenerate())
            val -> val
          end 

        :ok = User.Anon.route(anonymous_id, "/register_app_load")

        conn
        |> Plug.Conn.put_resp_cookie("aid", anonymous_id)
        |> Plug.Conn.put_resp_cookie("authorization", "", max_age: -1)
        |> render("index.html")
      _ -> 
        :ok = User.Individual.route(current_user, "/register_app_load") 
        
        conn
        |> Helpers.reset_cookies
        |> Plug.Conn.put_resp_cookie("authorization", Guardian.Plug.current_token(conn), http_only: false)
        |> render("index.html")
    end
  end
end