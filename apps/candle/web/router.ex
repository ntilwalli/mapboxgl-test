defmodule Candle.Router do
  use Candle.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
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
    pipe_through [:api, :api_auth]

    post "/login", LoginController, :index
    post "/signup", SignupController, :index
    post "/presignup", PresignupController, :index
    post "/logout", AuthController, :logout
  end

  scope "/api", Candle do
    pipe_through [:api, :api_auth]

    get "/retrieve/listing", RetrieveController, :listing
    post "/create/listing", CreateController, :listing
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
