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

  pipeline :browser_auth do
    plug Guardian.Plug.VerifySession
    plug Guardian.Plug.LoadResource
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :api_auth do
    plug Guardian.Plug.VerifyHeader, realm: "Bearer"
    plug Guardian.Plug.LoadResource
  end

  scope "/auth", Candle do
    pipe_through [:browser, :browser_auth]

    get "/:provider", AuthController, :request
    get "/:provider/callback", AuthController, :callback
    post "/:provider/callback", AuthController, :callback

    #post "/presignup", AuthController, :presignup
  end

  scope "/api_auth", Candle do
    pipe_through [:accepts_json, :browser, :browser_auth]

    post "/login", LoginController, :index
    post "/signup", SignupController, :index
    post "/presignup", PresignupController, :index
    post "/logout", AuthController, :logout
    post "/forgotten_password", UserController, :forgotten_password
    post "/reset_password", UserController, :reset_password
  end

  scope "/api", Candle do
    pipe_through [:accepts_json, :browser, :browser_auth]
    post "/geotag", UserController, :geotag
    post "/tz", UserController, :timezone
    post "/user", UserController, :route
  end

  scope "/", Candle do
    pipe_through [:browser, :browser_auth] # Use the default browser stack

    get "/*path", PageController, :index
  end

  # Other scopes may use custom stacks.
  # scope "/api", Candle do
  #   pipe_through :api
  # end
end
