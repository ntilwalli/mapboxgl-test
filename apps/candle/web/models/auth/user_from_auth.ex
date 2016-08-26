defmodule Candle.UserFromAuth do
  alias Candle.User
  alias Candle.Authorization
  alias Ueberauth.Auth

  def get_or_insert(%{provider: :identity} = auth, nil, current_user, repo) do
    IO.puts "Attempting identity login"
    case auth_and_validate(auth, repo) do
      {:error, :not_found} -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
      authorization ->
          user_from_authorization(authorization, current_user, repo)
    end
  end


  def get_or_insert(auth, nil, current_user, repo) do
    IO.puts "Attempting oauth signup/login"
    case auth_and_validate(auth, repo) do
      {:error, :not_found} ->
        IO.puts "Returning partial"
        :partial
      {:error, reason} -> {:error, reason}
      authorization ->
        if authorization.expires_at && authorization.expires_at < Guardian.Utils.timestamp do
          replace_authorization(authorization, auth, current_user, repo)
        else
          user_from_authorization(authorization, current_user, repo)
        end
    end
  end

  def get_or_insert(auth, user_info, current_user, repo) do
    IO.puts "Attempting registration"
   register_user_from_auth(auth, user_info, current_user, repo)
  end

  # We need to check the pw for the identity provider
  defp validate_auth_for_registration(%Authorization{provider: :identity} = auth, user_info, repo) do
    IO.puts "Attempting identity password validation"
    pw = Map.get(auth, :password)
    IO.puts pw
    _pwc = Map.get(auth, :password_confirmation)
    _email = user_info.email
    case pw do
      nil ->
        {:error, :password_is_null}
      "" ->
        {:error, :password_empty}
      _ ->
        user = repo.get_by(User, username: user_info.username)
        if !user do
          :ok
        else
          #{:error, %{type: "username", error: "Username already taken"}}
          {:error, :username_already_taken}
        end #validate_pw_length(pw, email)
    end
  end

  # All the other providers are oauth so should be good
  defp validate_auth_for_registration(auth, user_info, _repo) do
    IO.puts "Generic validate passed"
    IO.inspect auth
    IO.inspect user_info
    :ok #validate_email(email)
  end

  # defp validate_pw_length(pw, email) when is_binary(pw) do
  #   if String.length(pw) >= 8 do
  #     validate_email(email)
  #   else
  #     {:error, :password_length_is_less_than_8}
  #   end
  # end
  #
  # defp validate_email(email) when is_binary(email) do
  #   case Regex.run(~r/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/, email) do
  #     nil ->
  #       {:error, :invalid_email}
  #     [email] ->
  #       :ok
  #   end
  # end

  defp register_user_from_auth(auth, user_info, current_user, repo) do
    IO.puts "Attempting to register user from auth"
    case validate_auth_for_registration(auth, user_info, repo) do
      :ok ->
        case repo.transaction(fn -> create_user_from_auth(auth, user_info, current_user, repo) end) do
          {:ok, response} ->
            IO.puts "Got valid transaction response"
            response
          {:error, reason} ->
            IO.puts "Got error transaction response"
            {:error, reason}
        end
      {:error, reason} ->
        IO.puts "Error"
        IO.inspect reason
        {:error, reason}
    end
  end

  defp replace_authorization(authorization, auth, current_user, repo) do
    case validate_auth_for_registration(auth, nil, repo) do
      :ok ->
        case user_from_authorization(authorization, current_user, repo) do
          {:ok, user} ->
            case repo.transaction(fn ->
              repo.delete(authorization)
              authorization_from_auth(user, auth, repo)
              user
            end) do
              {:ok, user} -> {:ok, user}
              {:error, reason} -> {:error, reason}
            end
          {:error, reason} -> {:error, reason}
        end
      {:error, reason} -> {:error, reason}
    end
  end

  defp user_from_authorization(authorization, current_user, repo) do
    case repo.one(Ecto.assoc(authorization, :user)) do
      nil -> {:error, :user_not_found}
      user ->
        if current_user && current_user.id != user.id do
          {:error, :user_does_not_match}
        else
          {:ok, user}
        end
    end
  end

  defp create_user_from_auth(auth, user_info, current_user, repo) do
    user = current_user
    if !user, do: user = create_user(user_info, repo)
    authorization_from_auth(user, auth, repo)
    {:ok, user}
  end

  defp create_user(%User{name: name, email: email, username: username, type: type}, repo) do
    result = User.registration_changeset(%User{}, scrub(%{name: name, email: email, username: username, type: type}))
    |> repo.insert
    case result do
      {:ok, user} -> user
      {:error, reason} -> repo.rollback(reason)
    end
  end

  defp auth_and_validate(%Authorization{provider: :identity} = auth, repo) do
    case repo.get_by(Authorization, uid: uid_from_auth(auth), provider: to_string(auth.provider)) do
      nil -> {:error, :not_found}
      authorization ->
        IO.inspect auth
        IO.inspect authorization
        case auth.password do
          pass when is_binary(pass) ->
            if Comeonin.Bcrypt.checkpw(auth.password, authorization.token) do
              authorization
            else
              {:error, :password_does_not_match}
            end
          _ -> {:error, :password_required}
        end
    end
  end

  defp auth_and_validate(%{provider: :facebook} = auth, repo) do
    IO.inspect auth
    case repo.get_by(Authorization, uid: uid_from_auth(auth), provider: to_string(auth.provider)) do
      nil -> {:error, :not_found}
      authorization ->
        if authorization.uid == uid_from_auth(auth) do
          authorization
        else
          {:error, :uid_mismatch}
        end
    end
  end

  defp auth_and_validate(auth, repo) do
    case repo.get_by(Authorization, uid: uid_from_auth(auth), provider: to_string(auth.provider)) do
      nil -> {:error, :not_found}
      authorization ->
        if authorization.token == auth.token do
          authorization
        else
          {:error, :token_mismatch}
        end
    end
  end

  def get_authorization_with_token(%Authorization{provider: :identity} = auth) do
    %Authorization{
      provider: auth.provider,
      uid: auth.uid,
      token: token_from_auth(auth),
      password: auth.password,
      password_confirmation: auth.password_confirmation
    }
  end

  def partial_authorization_from_auth(%Auth{} = auth) do
    IO.inspect auth
    %Authorization{
      provider: auth.provider,
      uid: uid_from_auth(auth),
      token: token_from_auth(auth),
      refresh_token: auth.credentials.refresh_token,
      expires_at: auth.credentials.expires_at,
      image_url: image_url_from_auth(auth),
      profile_url: profile_url_from_auth(auth),
      password: password_from_auth(auth),
      password_confirmation: password_confirmation_from_auth(auth)
    }
  end

  defp authorization_from_auth(user, partial_auth, repo) do
    authorization = Ecto.build_assoc(user, :authorizations)
    result = Authorization.changeset(
      authorization,
      scrub(
        %{
          provider: to_string(partial_auth.provider),
          uid: partial_auth.uid,
          token: partial_auth.token,
          refresh_token: partial_auth.refresh_token,
          expires_at: partial_auth.expires_at,
          image_url: partial_auth.image_url,
          profile_url: partial_auth.profile_url,
          password: partial_auth.password,
          password_confirmation: partial_auth.password_confirmation
        }
      )
    ) |> repo.insert

    case result do
      {:ok, the_auth} -> the_auth
      {:error, reason} -> repo.rollback(reason)
    end
  end

  # defp name_from_auth(auth) do
  #   if auth.info.name do
  #     auth.info.name
  #   else
  #     [auth.info.first_name, auth.info.last_name]
  #     |> Enum.filter(&(&1 != nil and String.strip(&1) != ""))
  #     |> Enum.join(" ")
  #   end
  # end

  defp token_from_auth(%Authorization{provider: :identity} = auth) do
    case auth do
      %{ password: pass } when not is_nil(pass) ->
        Comeonin.Bcrypt.hashpwsalt(pass)
      _ -> nil
    end
  end

  defp token_from_auth(auth), do: auth.credentials.token

  defp uid_from_auth(auth), do: auth.uid

  defp image_url_from_auth(%Auth{ provider: :facebook } = auth), do: auth.info.image
  defp image_url_from_auth(%Auth{ provider: :twitter } = auth), do: auth.info.image
  defp image_url_from_auth(%Auth{ provider: :github } = auth), do: auth.info.urls.avatar_url

  defp profile_url_from_auth(%Auth{ provider: :facebook } = auth), do: auth.info.urls.facebook
  defp profile_url_from_auth(%Auth{ provider: :twitter } = auth), do: auth.info.urls["Twitter"]
  defp profile_url_from_auth(%Auth{ provider: :github } = auth), do: auth.info.urls.html_url

  defp password_from_auth(%Auth{}), do: nil
  defp password_confirmation_from_auth(%Auth{}), do: nil

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
