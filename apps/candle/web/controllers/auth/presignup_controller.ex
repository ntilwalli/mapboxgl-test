defmodule Candle.PresignupController do
  use Candle.Web, :controller
  plug Ueberauth

  alias Candle.Auth.Helpers

  def index(conn, %{
      "name" => name,
      "username" => username,
      "type" => type,
      "email" => email
    } = params, current_user, claims) do

    partial = Plug.Conn.get_session(conn, "partial_authorization")

    case partial do
      nil ->
        conn
        |> render(message: %{type: "redirect", data: "/?modal=signup"})
      _ ->
        user = Helpers.get_user(conn, current_user)
        case User.Router.route(User.Router, {user, {:oauth_signup, {params, partial}}}) do
        #case Auth.Manager.oauth_signup(Auth.Manager, {params, partial}) do
          {:error, error} ->
            conn
            |> render(message: %{
                type: "error",
                data: Map.put(params, "errors", [Helpers.convert_error(error)])
              })
          {:ok, user} ->
            conn
            |> Guardian.Plug.sign_in(user)
            |> Plug.Conn.delete_session("partial_authorization")
            |> render(message: %{type: "success"})
        end
    end
  end


end
