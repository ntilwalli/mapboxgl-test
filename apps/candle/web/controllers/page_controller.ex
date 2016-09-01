defmodule Candle.PageController do
  use Candle.Web, :controller
  plug :put_layout, false

  require Logger

  alias Candle.Auth.Helpers

  def index(conn, _params, current_user, _claims) do
    session_anon_id = conn.cookies["aid"]
    
    case current_user do
      nil ->
        anon_id = User.Registry.register_app_load(User.Registry, %{:anonymous_id => session_anon_id})
        Logger.debug "Register anonymous user app load: #{anon_id}"

        conn
        |> Plug.Conn.put_resp_cookie("aid", anon_id)
        |> Plug.Conn.put_resp_cookie("authorization", "", max_age: -1)
        |> render("index.html")
      auth ->
        User.Registry.register_app_load(User.Registry, %{:user_id => current_user.id, :anonymous_id => session_anon_id})
        Logger.debug "Register user app load: #{current_user.id}, transition from anonymous: #{session_anon_id}"

        conn
        #|> Plug.Conn.delete_session("aid")
        |> Helpers.reset_cookies
        |> Plug.Conn.put_resp_cookie("authorization", Guardian.Plug.current_token(conn), http_only: false)
        |> render("index.html")
    end
  end
end
