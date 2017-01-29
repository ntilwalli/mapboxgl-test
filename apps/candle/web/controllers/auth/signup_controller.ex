defmodule Candle.SignupController do
  use Candle.Web, :controller
  import Ecto.Changeset, only: [apply_changes: 1]
  import Candle.Auth.Helpers, only: [convert_error: 1, save_redirect: 2, manage_redirect: 1]
  alias Candle.Auth.Helpers
  alias Incoming.Authorization.Signup, as: SignupMessage

  plug :save_redirect
  plug Ueberauth

  def index(conn, params, current_user, _claims) do
    case current_user do
      nil -> 
        cs = SignupMessage.changeset(%SignupMessage{}, params)
        case cs.valid? do
          false ->
            render(conn, message: %{type: "error", data: "Sent sign-up params invalid"})
          true ->
            credentials = apply_changes(cs)
            aid = conn.cookies["aid"]
            case User.Anon.signup(aid, credentials) do
              {:error, error} ->
                render(conn, message: %{type: "error", data: Map.put(params, "errors", [convert_error(error)])})
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
