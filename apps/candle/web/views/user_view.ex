defmodule Candle.UserView do
  use Candle.Web, :view

  def render("route.json", %{message: message}) do
    message
  end
end