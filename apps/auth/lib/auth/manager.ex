defmodule Auth.Manager do
  use GenServer

  alias Shared.Repo
  alias Shared.Authorization
  alias Shared.User

  alias Auth.Utils
  alias Auth.Registration
  alias Auth.Credential

  alias Incoming.Authorization.Login, as: LoginMessage
  alias Incoming.Authorization.Signup, as: SignupMessage
  alias Incoming.Authorization.Presignup, as: PresignupMessage
  alias Incoming.Authorization.ForgottenPassword, as: ForgottenPasswordMessage
  alias Incoming.Authorization.ResetPassword, as: ResetPasswordMessage

  import Ecto.Query, only: [from: 2]

  # Client functions
  def start_link(name, email_manager) do
    GenServer.start_link(__MODULE__, {:ok, email_manager}, name: name)
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

  def forgotten_password(server, email_address) do
    GenServer.call(server, {:forgotten_password, email_address})
  end

  def reset_password(server, user, password) do
    GenServer.call(server, {:reset_password, user, password})
  end

  # Server functions
  def init({:ok, email_manager}) do
    {:ok, %{email_manager: email_manager}}
  end

  def handle_call({:login, %LoginMessage{
        username: username,
        password: password
      }}, _from, state) do

   out = Utils.login(
     %Credential{
        username: username, 
        password: password
      }, Repo)


   IO.inspect {:login_out, out}   
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

   input = {%Registration{
      name: name, 
      username: username, 
      email: email, 
      type: type
    }, auth}

   {:reply,
     Utils.oauth_signup(input, Repo), 
     state
    }
  end

  def handle_call({:logout, user_id}, _from, state) do
    {:reply, nil, state}
  end

  def handle_call({
    :forgotten_password,
    %ForgottenPasswordMessage{
      email: email_address
    }}, _from, %{email_manager: e_mgr} = state) do
    query = from l in Shared.User, where: l.email == ^email_address
    IO.inspect {:forgotten_password_query, query}
    case Shared.Repo.one(query) do
      nil -> {:reply, {:error, :email_address_not_found}, state}
      user -> 
        after_60 = Calendar.DateTime.add!(Calendar.DateTime.now_utc(), 60*60)
        token = UUID.uuid1(:hex)
        changes = %{token: token, expires_at: after_60}
        result =
          case Shared.Repo.get(Shared.ForgottenPasswordToken, user.id) do
            nil  -> %Shared.ForgottenPasswordToken{user_id: user.id} # Post not found, we build one
            record -> record          # Post exists, let's use it
          end
          |> Shared.ForgottenPasswordToken.changeset(changes)
          |> Shared.Repo.insert_or_update()

        {:ok, model} = result
        Candle.EmailManager.forgotten_password(e_mgr, user, token)
        {:reply, :ok, state}
    end
  end

  def handle_call({:reset_password, user, password}, _from, state) do
    out = Utils.update_password(user, password, Repo)
    {:reply, out, state}
  end


end