defmodule Candle.LoginController do
  use Candle.Web, :controller
  require Logger
  import Ecto.Changeset, only: [apply_changes: 1]
  import  Candle.Auth.Helpers, only: [convert_error: 1, save_redirect: 2, manage_redirect: 1]
  alias Incoming.Authorization.Login, as: LoginMessage

  plug :save_redirect
  plug Ueberauth

  def index(conn, params, current_user, _claims) do
    #IO.inspect {:current_user, current_user}
    case current_user do
      nil ->
        cs = LoginMessage.changeset(%LoginMessage{}, params)
        case cs.valid? do
          false ->
            render(conn, message: %{type: "error", data: "Sent log-in params invalid"})
          true ->
            credentials = apply_changes(cs)
            aid = conn.cookies["aid"]
            case User.Anon.login(aid, credentials) do
              {:error, error} ->
                render(conn, message: %{type: "error", data: Map.put(%{username: credentials.username}, "errors", [convert_error(error)])})
              {:ok, user} ->
                conn
                |> Guardian.Plug.sign_in(user)
                |> manage_redirect
                #|> render(message: %{type: "success"})
            end
        end    
      _ ->  
        render(conn, message: %{type: "error", data: "User already logged-in"})
    end
  end
end
