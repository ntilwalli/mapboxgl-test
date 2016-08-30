defmodule Candle.PresignupController do
  use Candle.Web, :controller
  plug Ueberauth

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
            conn
            |> render(message: %{
                type: "error",
                data: Map.put(params, "errors", [Helpers.convert_error(error)])
              })
          {:ok, user} ->
            conn
            |> Guardian.Plug.sign_in(user)
            |> render(message: %{type: "success"})
        end
    end
  end


end
