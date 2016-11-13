defmodule Candle.AuthController do
  use Candle.Web, :controller
  require Logger
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
    case current_user do
      nil ->
        partial = %Authorization{
          provider: auth.provider,
          uid: auth.uid,
          token: auth.credentials.token,
          refresh_token: auth.credentials.refresh_token,
          expires_at: auth.credentials.expires_at,
          profile: auth.info
        }

        {:ok, pid} = User.Registry.lookup_anonymous(User.Registry, conn.cookies["aid"])
        case User.Anon.oauth_login(pid, partial) do
          {:ok, user} ->
            Logger.info "Successfully found oauth user"
            conn
            |> Guardian.Plug.sign_in(user)
            |> redirect(to: "/")
          :error ->
            Logger.info "Failed to find oauth user"
            conn
            |> Plug.Conn.put_session("partial_authorization", partial)
            |> Plug.Conn.put_resp_cookie("suggested_name", name_from_auth(auth), http_only: false)
            |> redirect(to: "/?modal=presignup")
        end        
      _ ->  
        redirect(conn, to: "/")
    end
  end

  def logout(conn, _params, current_user, _claims) do
    if current_user do
      {:ok, pid} = User.Registry.lookup_user(User.Registry, current_user)
      :ok = User.Auth.logout(pid)
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
