defmodule Candle.CreateListingController do
  use Candle.Web, :controller
  plug Ueberauth

  alias Candle.Auth.Helpers

  def route(conn, %{action: _, payload: _} = params, current_user, _claims) do
    user = Helpers.get_user(conn, current_user)
    case User.Router.route(User.Router, {user, params}) do
      {:ok, response} ->
        response
      {:error, response} ->
        response
    end
  end
end