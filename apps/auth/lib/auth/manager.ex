defmodule Auth.Manager do
  use GenServer

  alias Shared.Repo
  alias Shared.Authorization
  alias Shared.User

  alias Auth.Utils
  alias Auth.Registration
  alias Auth.Credential

  alias Shared.Message.Authorization.Login, as: LoginMessage
  alias Shared.Message.Authorization.Signup, as: SignupMessage
  alias Shared.Message.Authorization.Presignup, as: PresignupMessage

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

  def oauth_signup(server, {_registration, _auth} = info) do
    GenServer.call(server, {:oauth_signup, info})
  end

  def logout(server, user_id) do
    GenServer.call(server, {:logout, user_id})
  end

  # Server functions
  def init(:ok) do
    {:ok, nil}
  end

  def handle_call({:login, %LoginMessage{
        username: username,
        password: password
      }}, _from, state) do
   IO.puts("Got to login")
   out = Utils.login(
     %Credential{
        username: username, 
        password: password
      }, Repo)
   {:reply, out, state}
  end

    def handle_call({:signup, %SignupMessage{
        name: name,
        username: username,
        email: email,
        type: type,
        password: password
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

  def handle_call({:oauth_login, %Authorization{} = auth}, _from, state) do
    {:reply, Utils.oauth_login(auth, Repo), state}
  end

  def handle_call({:oauth_signup, {
      %PresignupMessage{
        name: name,
        username: username,
        email: email,
        type: type
      } = registration,
      %Authorization{} = auth
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

  def handle_call({:logout, user_id}, _from, state) do
    {:reply, nil, state}
  end

end