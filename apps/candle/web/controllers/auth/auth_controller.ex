defmodule Candle.AuthController do
  use Candle.Web, :controller
  plug Ueberauth
  plug :put_layout, false

  def request(_conn, _params, _current_user, _claims) do
    raise "Auth request should be redirected before we get here..."
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params, _current_user, _claims) do
    conn
    |> redirect(to: "/")
  end

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params, _current_user, _claims) do
    case Auth.Manager.oauth_login(Auth.Manager, auth) do
      {:ok, user} ->
        conn
        |> Guardian.Plug.sign_in(user)
        |> redirect(to: "/")
      :error ->
        conn
        |> Plug.Conn.put_session("partial_authorization", auth)
        |> Plug.Conn.put_resp_cookie("suggested_name", name_from_auth(auth), http_only: false)
        |> redirect(to: "/?modal=presignup")
    end
  end

  def logout(conn, _params, _current_user, _claims) do
    jwt = Guardian.Plug.current_token(conn)
    if jwt do
      {:ok, claims} = Guardian.Plug.claims(conn)
      Guardian.revoke!(jwt, claims)
    end

    conn
    |> Guardian.Plug.sign_out
    |> render("index.json", message: %{type: "success"})
  end

  defp name_from_auth(auth) do
    if auth.info.name do
      auth.info.name
    else
      [auth.info.first_name, auth.info.last_name]
      |> Enum.filter(&(&1 != nil and String.strip(&1) != ""))
      |> Enum.join(" ")
    end
  end
end
