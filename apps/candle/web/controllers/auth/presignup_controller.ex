defmodule Candle.PresignupController do
  use Candle.Web, :controller
  plug Ueberauth

  alias Candle.Auth.Helpers

  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Message.Authorization.Presignup, as: PresignupMessage

  def index(conn, params, current_user, _claims) do
    case current_user do
      nil ->
        partial = Plug.Conn.get_session(conn, "partial_authorization")
        case partial do
          nil ->
            conn
            |> render(message: %{type: "redirect", data: "/?modal=signup"})
          _ ->
            cs = PresignupMessage.changeset(%PresignupMessage{}, params)
            case cs.valid? do
              false ->
                render(conn, message: %{type: "error", data: "Sent pre-sign-up params invalid"})
              true ->
                credentials = apply_changes(cs)
                {:ok, pid} = User.Registry.lookup_anonymous(User.Registry, conn.cookies["aid"])
                case User.Anon.oauth_signup(pid, {credentials, partial}) do
                  {:error, error} -> 
                    render(conn, message: %{type: "error", data: Map.put(params, "errors", [Helpers.convert_error(error)])})
                  {:ok, user} ->
                    conn
                    |> Guardian.Plug.sign_in(user)
                    |> Plug.Conn.delete_session("partial_authorization")
                    |> render(message: %{type: "success"})
                end
            end
        end
      _ ->  
        render(conn, message: %{type: "error", data: "User already logged-in"})
    end
  end
end
