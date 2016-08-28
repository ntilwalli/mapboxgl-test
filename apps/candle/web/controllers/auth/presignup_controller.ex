defmodule Candle.PresignupController do
  use Candle.Web, :controller
  plug Ueberauth
  plug :fetch_session

  # alias Candle.UserFromAuth
  # alias Candle.User
  # alias Candle.Repo
  alias Candle.Auth.Helpers


  def index(conn, %{
      "name" => name,
      "username" => username,
      "type" => type,
      "email" => email
    } = params, current_user, claims) do

    auth = Plug.Conn.get_session(conn, "partial_authorization")

    case auth do
      nil ->
        conn
        |> render(message: %{type: "redirect", data: "/?modal=signup"})
      _ ->
        case Auth.Manager.oauth_signup(Auth.Manager, params, auth) do
          {:error, error} ->
            render(conn, message: %{
              type: "error",
              data: Map.put(params, "errors", [Helpers.convert_error(error)])
            })
          {:ok, user} ->
            new_conn = Guardian.Plug.sign_in(conn, user)
            jwt = Guardian.Plug.current_token(new_conn)
            {:ok, claims} = Guardian.Plug.claims(new_conn)
            exp = Map.get(claims, "exp")

            conn
            |> Plug.Conn.delete_session("partial_authorization")
            |> Plug.Conn.put_session("authorization", "Bearer #{jwt}")
            |> Plug.Conn.put_session("x-expires", Integer.to_string(exp))
            |> render(message: %{type: "success"})
        end
    end
  end


end
