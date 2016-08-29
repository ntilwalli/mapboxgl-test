defmodule Candle.SignupController do
  use Candle.Web, :controller
  plug Ueberauth
  plug :fetch_session

  alias Candle.UserFromAuth
  alias Candle.User
  alias Candle.Auth.Helpers
  alias Candle.Authorization


  def index(conn, %{
        "name" => name,
        "username" => username,
        "email" => email,
        "type" => type,
        "password" => password
      } = auth, current_user, _claims) do

    case Auth.Manager.signup(Auth.Manager, auth) do
      {:error, error} ->
        render(conn, message: %{
          type: "error",
          data: Map.put(auth, "errors", [Helpers.convert_error(error)])
        })
      {:ok, user} ->
        new_conn = Guardian.Plug.sign_in(conn, user)
        jwt = Guardian.Plug.current_token(new_conn)
        # {:ok, claims} = Guardian.Plug.claims(new_conn)
        # exp = Map.get(claims, "exp")

        new_conn
        |> Plug.Conn.put_session("authorization", "Bearer #{jwt}")
        #|> Plug.Conn.put_session("x-expires", Integer.to_string(exp))
        |> render(message: %{type: "success"})
    end
  end

end
