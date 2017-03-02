defmodule Candle.Router do
  use Candle.Web, :router

  # pipeline :accepts_html do
  #   plug :accepts, ["html"]
  # end

  pipeline :accepts_json do
    plug :accepts, ["json"]
  end

  pipeline :browser do
    plug :fetch_session
    # plug :fetch_flash
    # plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Candle do
    pipe_through [:browser] # Use the default browser stack
    get "/*path", PageController, :index
  end

  # Other scopes may use custom stacks.
  # scope "/api", Candle do
  #   pipe_through :api
  # end
end
