defmodule Candle.AuthController do
  use Candle.Web, :controller
  plug Ueberauth
  plug :put_layout, false

  alias Candle.Auth.Helpers
  alias Shared.Authorization

  def request(_conn, _params, _current_user, _claims) do
    raise "Auth request should be redirected before we get here..."
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params, _current_user, _claims) do
    conn
    |> redirect(to: "/")
  end

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params, current_user, _claims) do

    user = Helpers.get_user(conn, current_user)


    partial = %Authorization{
      provider: auth.provider,
      uid: auth.uid,
      token: auth.credentials.token,
      refresh_token: auth.credentials.refresh_token,
      expires_at: auth.credentials.expires_at,
      profile: auth.info
    }

    IO.puts "Testing auth"
    IO.inspect partial

    pid = User.Registry.lookup(User.Registry, user)
    case User.Anon.route(User.Anon, pid, partial) do
    #case Auth.Manager.oauth_login(Auth.Manager, partial) do
      {:ok, user} ->
        conn
        |> Guardian.Plug.sign_in(user)
        |> redirect(to: "/")
      :error ->
        conn
        |> Plug.Conn.put_session("partial_authorization", partial)
        |> Plug.Conn.put_resp_cookie("suggested_name", name_from_auth(auth), http_only: false)
        |> redirect(to: "/?modal=presignup")
    end
  end

  def logout(conn, _params, current_user, _claims) do
    if current_user != nil do
      Auth.Manager.logout(Auth.Manager, current_user.id)
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
