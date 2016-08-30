defmodule Candle.PageController do
  use Candle.Web, :controller
  plug :put_layout, false

  def index(conn, _params, current_user, _claims) do
    #authorization = Plug.Conn.get_session(conn, "authorization")
    
    #expires = Plug.Conn.get_session(conn, "x-expires")

    # IO.puts("Current user...")
    # IO.inspect(current_user)
    # IO.inspect(authorization)

    alias Candle.Auth.Helpers

    case current_user do
      nil ->
        conn
        # |> Helpers.reset_cookies
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
