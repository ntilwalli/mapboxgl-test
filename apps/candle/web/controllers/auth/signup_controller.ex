defmodule Candle.SignupController do
  use Candle.Web, :controller
  plug Ueberauth

  import Ecto.Changeset, only: [apply_changes: 1]
  alias Candle.Auth.Helpers
  alias Shared.Message.Authorization.Signup, as: SignupMessage

  def index(conn, params, current_user, _claims) do
    case current_user do
      nil -> 
        cs = SignupMessage.changeset(%SignupMessage{}, params)
        case cs.valid? do
          false ->
            render(conn, message: %{type: "error", data: "Sent sign-up params invalid"})
          true ->
            credentials = apply_changes(cs)
            {:ok, pid} = User.Registry.lookup_anonymous(User.Registry, conn.cookies["aid"])
            case User.Anon.signup(pid, credentials) do
              {:error, error} ->
                render(conn, message: %{type: "error", data: Map.put(params, "errors", [Helpers.convert_error(error)])})
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
