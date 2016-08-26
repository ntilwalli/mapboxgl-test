defmodule Candle.LoginController do
  use Candle.Web, :controller
  plug Ueberauth
  plug :fetch_session

  alias Candle.UserFromAuth
  alias Candle.User
  alias Candle.Authorization
  alias Candle.Repo
  alias Candle.Auth.Helpers


  def index(conn, %{
      "username" => username,
      "password" => password
    } = params, current_user, _claims) do

    partial = %Authorization{provider: :identity, uid: username, password: password}

    case UserFromAuth.get_or_insert(partial, nil, current_user, Repo) do
      {:error, error} ->
        render(conn, message: %{
          type: "error",
          data: Map.put(%{username: username}, "errors", [Helpers.convert_error(error)])
        })
      {:ok, user} ->

        new_conn = Guardian.Plug.sign_in(conn, user)
        jwt = Guardian.Plug.current_token(new_conn)
        {:ok, claims} = Guardian.Plug.claims(new_conn)
        exp = Map.get(claims, "exp")

        conn
        |> Plug.Conn.put_session("authorization", "Bearer #{jwt}")
        |> Plug.Conn.put_session("x-expires", Integer.to_string(exp))
        |> render(message: %{type: "success"})
    end
  end


end
