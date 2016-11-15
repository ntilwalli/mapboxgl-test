defmodule Candle.LoginController do
  use Candle.Web, :controller
  plug Ueberauth
  require Logger
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Message.Incoming.Authorization.Login, as: LoginMessage

  def index(conn, params, current_user, _claims) do
    IO.inspect current_user
    case current_user do
      nil ->
        cs = LoginMessage.changeset(%LoginMessage{}, params)
        case cs.valid? do
          false ->
            render(conn, message: %{type: "error", data: "Sent log-in params invalid"})
          true ->
            credentials = apply_changes(cs)
            {:ok, pid} = User.Registry.lookup_anonymous(User.Registry, conn.cookies["aid"])
            case User.Anon.login(pid, credentials) do
              {:error, error} ->
                render(conn, message: %{type: "error", data: Map.put(%{username: credentials.username}, "errors", [Helpers.convert_error(error)])})
              {:ok, user} ->
                conn
                |> Guardian.Plug.sign_in(user)
                |> render(message: %{type: "success"})
            end
        end    
      _ ->  
        render(conn, message: %{type: "error", data: "User already logged-in"})
    end
  end
end
