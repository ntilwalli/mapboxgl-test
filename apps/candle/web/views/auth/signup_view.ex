defmodule Candle.SignupView do
  use Candle.Web, :view

  def render("index.json", %{message: message}) do
    message
  end
end
