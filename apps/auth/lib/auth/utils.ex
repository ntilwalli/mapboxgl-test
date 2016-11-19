defmodule Auth.Utils do
  import Ecto.Query, only: [from: 2, first: 1]
  alias Shared.User
  alias Shared.Authorization

  alias Auth.Registration
  alias Auth.Credential

  def signup(%Registration{
      name: name, 
      username: username, 
      type: type, 
      email: email, 
      password: password
    } = registration, repo) do
    case is_username_available(username, repo) do
      :ok ->
        auth_temp = transform_registration_authorization(registration)
        user_temp = %User{type: type, name: name, username: username, email: email}
        create_user_authorization(auth_temp, user_temp, repo)
      {:error, error} = val -> val
    end
  end

  def oauth_signup({
      %Registration{
        name: name, 
        username: username, 
        type: type, 
        email: email, 
      } = registration,
      %Authorization{provider: provider, uid: uid} = partial
    }, repo) do
    case get_existing_authorization(provider, uid, repo) do
      :error ->
        #IO.puts "No existing auth"
        case is_username_available(username, repo) do
          :ok ->
            #IO.puts "ok username"
            user_temp = %User{type: type, name: name, username: username, email: email}
            create_user_authorization(partial, user_temp, repo)
          {:error, error} = val -> 
            #IO.puts "error"
            #IO.inspect val
            val
        end
      {:ok, auth} ->
        #IO.puts "Existing auth..."
        {:error, :authorization_already_exists}
    end
  end

  def login(%Credential{username: username, password: password}, repo) do
    case get_existing_authorization(:identity, username, repo) do
      {:ok, auth} ->
        case password do
          password when is_binary(password) ->
            if Comeonin.Bcrypt.checkpw(password, auth.token) do
              {:ok, auth.user}
            else
              {:error, :password_does_not_match}
            end
          _ -> {:error, :password_required}
        end
      :error -> {:error, :invalid_username_password}
    end
  end

  def oauth_login(%Authorization{provider: provider, uid: uid} = temp, repo) do
    case get_existing_authorization(provider, uid, repo) do
      {:ok, authorization} ->
        #IO.puts "oauth_login ok"
        #IO.inspect authorization
        Authorization.changeset(
          authorization, 
          scrub(%{
            token: to_string(temp.token), 
            refresh_token: to_string(temp.refresh_token),
            expires_at: temp.expires_at,
            profile: temp.profile
          })
        ) |> repo.update
        {:ok, authorization.user}
      val -> val
    end
  end

  def is_username_available(username, repo) do
    user = repo.get_by(User, username: username)
    if !user do
      :ok
    else
      {:error, :username_already_taken}
    end
  end

  def get_existing_authorization(provider, uid, repo) do
    str_provider = to_string(provider)
    query = from u in Authorization, where: u.provider == ^str_provider and u.uid == ^uid, preload: [:user]
    case repo.one(query)  do
      nil -> :error
      auth -> {:ok, auth}
    end
  end 

  defp create_user(%User{name: name, email: email, username: username, type: type}, repo) do
    result = User.registration_changeset(%User{}, scrub(%{name: name, email: email, username: username, type: type}))
    |> repo.insert
    case result do
      {:ok, user} -> {:ok, user}
      {:error, reason} -> repo.rollback(reason)
    end
  end

  defp create_authorization(user, %{provider: provider} = partial_auth, repo) do
    authorization = Ecto.build_assoc(user, :authorizations)
    #IO.inspect authorization
    #IO.inspect partial_auth
    #IO.inspect partial_auth.token
    input = %{
          provider: to_string(provider),
          uid: to_string(partial_auth.uid),
          token: to_string(partial_auth.token),
          refresh_token: to_string(partial_auth.refresh_token),
          expires_at: partial_auth.expires_at,
          profile: if (provider == :identity) do nil else partial_auth end
        }
    #IO.inspect input
    #IO.inspect scrub(input)
    cs = Authorization.changeset(
      authorization,
      scrub(input)
    )

    #IO.inspect cs

    result = repo.insert(cs)

    case result do
      {:ok, the_auth} -> {:ok, the_auth}
      {:error, reason} -> repo.rollback(reason)
    end
  end

  defp create_user_authorization(auth_temp, user_temp, repo) do

    case repo.transaction(
      fn -> 
        IO.puts "in transaction"
        with {:ok, user} = create_user(user_temp, repo),
             {:ok, auth} = create_authorization(user, auth_temp, repo),
             do: {:ok, user}
      end
    ) do
      {:ok, response} ->
        #IO.puts "Got valid transaction response"
        response
      {:error, reason} ->
        #IO.puts "Got error transaction response"
        #IO.inspect reason
        {:error, reason}
    end
  end

  defp transform_registration_authorization(%Registration{username: username, password: password}) do
    %Authorization{
      provider: :identity,
      uid: username,
      token: token_from_password(password),
    }
  end

  defp token_from_password(password) do
    Comeonin.Bcrypt.hashpwsalt(password)
  end

  defp token_from_auth(auth), do: auth.credentials.token

  # We don't have any nested structures in our params that we are using scrub with so this is a very simple scrub
  defp scrub(params) do
    result = Enum.filter(params, fn
      {_key, val} when is_binary(val) -> String.strip(val) != ""
      {_key, val} when is_nil(val) -> false
      _ -> true
    end)
    |> Enum.into(%{})
    result
  end
end
