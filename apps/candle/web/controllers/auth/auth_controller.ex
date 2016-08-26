defmodule Candle.AuthController do
  use Candle.Web, :controller
  plug Ueberauth
  plug :put_layout, false
  plug :fetch_session

  alias Candle.UserFromAuth
  alias Candle.User
  #alias Candle.Authorization

  alias Ueberauth.Auth
  alias Ueberauth.Auth.Extra


  def request(_conn, _params, _current_user, _claims) do
    raise "Auth request should be redirected before we get here..."
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params, _current_user, _claims) do
    conn
    |> reset_cookies()
    |> redirect(to: "/")
  end

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params, current_user, _claims) do
    IO.puts "Callback: attempting oauth signup/login"
    partial = UserFromAuth.partial_authorization_from_auth(auth)

    case UserFromAuth.get_or_insert(partial, nil, current_user, Repo) do
      {:ok, user} ->
        IO.puts("get_or_insert ok, printing user...")
        IO.inspect(user)
        new_conn = Guardian.Plug.sign_in(conn, user)
        jwt = Guardian.Plug.current_token(new_conn)
        IO.puts("JWT...")
        IO.inspect(jwt)
        {:ok, claims} = Guardian.Plug.claims(new_conn)
        IO.puts("Claims...")
        IO.inspect(claims)
        exp = Map.get(claims, "exp")

        new_conn
        |> Plug.Conn.put_session("authorization", "Bearer #{jwt}")
        |> Plug.Conn.put_session("x-expires", Integer.to_string(exp))
        |> redirect(to: "/")
      :partial ->
        conn
        |> reset_cookies()
        |> Plug.Conn.put_session("partial_authorization", partial)
        |> Plug.Conn.put_resp_cookie("suggested_name", name_from_auth(auth), http_only: false)
        |> redirect(to: "/?modal=presignup")
      {:error, error} ->
        IO.inspect error

        conn
        |> redirect(to: "/")
    end
  end

  def logout(conn, _params, _current_user, _claims) do
    jwt = Guardian.Plug.current_token(conn)
    if jwt do
      {:ok, claims} = Guardian.Plug.claims(conn)
      Guardian.revoke!(jwt, claims)
    end

    conn
    |> reset_cookies()
    |> Plug.Conn.delete_session("authorization")
    |> Plug.Conn.delete_session("x-expires")
    |> render("index.json", message: %{type: "success"})
  end

  # def logout(conn, _params, _current_user, {:error, _}) do
  #   conn
  #   |> Plug.Conn.delete_session("authorization")
  #   |> Plug.Conn.delete_session("x-expires")
  #   |> render("index.json", message: %{type: "error"})
  # end

  defp reset_cookies(conn) do
    conn
    |> Plug.Conn.put_resp_cookie("suggested_name", "", max_age: -1)
  end

  # defp reset_guardian_token_cookie(conn) do
  #   conn
  #   |> Plug.Conn.put_resp_cookie("guardian_token", "", max_age: -1)
  # end

  # defp add_csrf_token(conn) do
  #   csrf_token = Plug.CSRFProtection.get_csrf_token()
  #
  #   conn
  #   |> Plug.Conn.put_resp_cookie("_csrf_token", csrf_token, http_only: false)
  # end

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
