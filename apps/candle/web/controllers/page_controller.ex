defmodule Candle.PageController do
  use Candle.Web, :controller
  plug :put_layout, false

  alias Candle.Auth.Helpers

  def index(conn, _params, current_user, _claims) do
    case current_user do
      nil ->
        conn
        |> Plug.Conn.put_resp_cookie("authorization", "", max_age: -1)
        |> render("index.html")
      auth ->
        conn
        |> Helpers.reset_cookies
        |> Plug.Conn.put_resp_cookie("authorization", Guardian.Plug.current_token(conn), http_only: false)
        |> render("index.html")
    end
  end
end
