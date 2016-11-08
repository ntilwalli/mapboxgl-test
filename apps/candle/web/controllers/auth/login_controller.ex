defmodule Candle.LoginController do
  use Candle.Web, :controller
  plug Ueberauth

  alias Candle.Auth.Helpers

  def index(conn, %{
      "username" => username,
      "password" => password
    } = params, current_user, _claims) do
    
    IO.puts "login attempt"
    IO.inspect params

    user = Helpers.get_user(conn, current_user)
    {:ok, pid} = User.Registry.lookup(User.Registry, user)
    case User.Anon.login(pid, params) do
    #case Auth.Manager.login(Auth.Manager, params) do
      {:error, error} ->
        conn
        |> render(message: %{
            type: "error",
            data: Map.put(%{username: username}, "errors", [Helpers.convert_error(error)])
          })
      {:ok, user} ->
        conn
        |> Guardian.Plug.sign_in(user)
        |> render(message: %{type: "success"})
    end
  end


end
