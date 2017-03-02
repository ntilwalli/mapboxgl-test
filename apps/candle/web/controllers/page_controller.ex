defmodule Candle.PageController do
  use Candle.Web, :controller
  plug :put_layout, false

  require Logger


  def index(conn, _params) do

        conn
        |> render("index.html")
  end
end