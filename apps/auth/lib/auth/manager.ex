defmodule Auth.Manager do
  use GenServer

  alias Shared.Repo
  alias Shared.Authorization
  alias Shared.User

  alias Auth.Utils
  alias Auth.Registration
  alias Auth.Credential
  alias Ueberauth.Auth, as: UberauthAuth

  # Client functions
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  def login(server, info) do
    GenServer.call(server, {:login, info})
  end

  def signup(server, info) do
    GenServer.call(server, {:signup, info})
  end

  def oauth_login(server, info) do
    GenServer.call(server, {:oauth_login, info})
  end

  def oauth_signup(server, registration, auth) do
    GenServer.call(server, {:oauth_signup, {registration, auth}})
  end

  def logout(server, info) do
    GenServer.call(server, {:logout, info})
  end

  # Server functions
  def init(:ok) do
    {:ok, nil}
  end

  def handle_call({:login, %{
        "username" => username,
        "password" => password
      }}, _from, state) do

   out = Utils.login(
     %Credential{
        username: username, 
        password: password
      }, Repo)
   {:reply, out, state}
  end

    def handle_call({:signup, %{
        "name" => name,
        "username" => username,
        "email" => email,
        "type" => type,
        "password" => password
      }}, _from, state) do

   out = Utils.signup(
     %Registration{
        name: name, 
        username: username, 
        email: email, 
        type: type, 
        password: password
      }, Repo)
   {:reply, out, state}
  end

  def handle_call({:oauth_login, %UberauthAuth{} = auth}, _from, state) do
    {:reply, Utils.oauth_login(auth, Repo), state}
  end

  def handle_call({:oauth_signup, {
      %{
        "name" => name,
        "username" => username,
        "email" => email,
        "type" => type
      } = registration,
      %UberauthAuth{} = auth
    }}, _from, state) do
   IO.inspect registration
   IO.inspect auth
   input = {%Registration{
      name: name, 
      username: username, 
      email: email, 
      type: type
    }, auth}
   IO.inspect input
   {:reply,
     Utils.oauth_signup(input, Repo), 
     state
    }
  end

end