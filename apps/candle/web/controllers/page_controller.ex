defmodule Candle.PageController do
  use Candle.Web, :controller
  plug :put_layout, false

  def index(conn, _params, current_user, _claims) do
    authorization = Plug.Conn.get_session(conn, "authorization")
    #expires = Plug.Conn.get_session(conn, "x-expires")

    IO.puts("Current user...")
    IO.inspect(current_user)
    # IO.inspect(authorization)

    case authorization do
      nil ->
        conn
        |> Plug.Conn.put_resp_cookie("authorization", "", max_age: -1)
        #|> Plug.Conn.put_resp_cookie("x-expires", "", max_age: -1)
        |> render("index.html")
      auth ->
        conn
        |> Plug.Conn.put_resp_cookie("authorization", auth, http_only: false)
        #|> Plug.Conn.put_resp_cookie("x-expires", expires, http_only: false)
        |> render("index.html")
    end
  end
end
