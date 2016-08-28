defmodule Auth.Utils.Test do
  use ExUnit.Case, async: true
  doctest Auth.Utils

  import Ecto.Query, only: [from: 2]
  alias Shared.Repo
  alias Shared.User
  alias Shared.Authorization
  alias Auth.Registration
  alias Ueberauth.Auth, as: UberauthAuth

  setup do
    query = from u in User, where: u.username == "gautham" or u.username == "nikhil"
    Repo.delete_all(User)
    :ok
  end

  test "signup" do
    registration = %Registration{
      name: "Gautham",
      username: "gautham",
      email: "g@g.com",
      type: "individual",
      password: "g"
    }
    {:ok, user} = Auth.Utils.signup(registration, Repo)
    user_q = from u in User, where: u.username == "gautham"
    user_from_q = Repo.get_by!(User, username: "gautham")
    assert user_from_q.username == "gautham"
    assert user_from_q.email == "g@g.com"
    user_id = user_from_q.id
    auth_from_q = Repo.get_by!(Authorization, user_id: user_id)
    assert user_id = auth_from_q.user_id
    {:error, error} = Auth.Utils.signup(registration, Repo)
    assert error == :username_already_taken
  end

  test "oauthSignup: facebook" do
    registration = %Registration{
      name: "Nikhil ",
      username: "nikhil",
      email: "n@n.com",
      type: "individual"
    }

    auth = %UberauthAuth{
      provider: :facebook,
      uid: "uid",
      credentials: %{
        token: "token",
        refresh_token: nil,
        expires_at: nil
      }
    }

    {:ok, user} = Auth.Utils.oauth_signup({registration, auth}, Repo)
    user_q = from u in User, where: u.username == "nikhil"
    user_from_q = Repo.get_by!(User, username: "nikhil")
    assert user_from_q.username == "nikhil"
    assert user_from_q.email == "n@n.com"
    user_id = user_from_q.id
    auth_from_q = Repo.get_by!(Authorization, user_id: user_id)
    assert user_id = auth_from_q.user_id
    {:error, value} = Auth.Utils.oauth_signup({registration, auth}, Repo)
    assert value == :authorization_already_exists
  end
end