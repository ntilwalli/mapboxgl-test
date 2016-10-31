defmodule Candle.SignupController do
  use Candle.Web, :controller
  plug Ueberauth

  alias Candle.Auth.Helpers

  def index(conn, %{
        "name" => name,
        "username" => username,
        "email" => email,
        "type" => type,
        "password" => password
      } = auth, current_user, _claims) do

    user = Helpers.get_user(conn, current_user)
    pid = User.Registry.lookup(User.Registry, user)
    case User.Anon.signup(pid, auth) do
    #case Auth.Manager.signup(Auth.Manager, auth) do
      {:error, error} ->
        conn
        |> render(message: %{
            type: "error",
            data: Map.put(auth, "errors", [Helpers.convert_error(error)])
          })
      {:ok, user} ->
        conn
        |> Guardian.Plug.sign_in(user)
        |> render(message: %{type: "success"})
    end
  end

end
