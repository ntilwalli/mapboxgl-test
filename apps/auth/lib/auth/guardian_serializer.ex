defmodule Auth.GuardianSerializer do
  @behaviour Guardian.Serializer

  alias Shared.Repo
  alias Shared.User

  # def for_token(user = %User{}), do: { :ok, "User:#{user.id}" }
  def for_token(%User{} = user) do
    IO.puts "for_token" 
    IO.inspect user
    {:ok, Poison.encode!(user)}
    # {:ok, Poison.encode!(%{
    #   :id => user.id
    # })}
  end
  #def for_token(_), do: { :error, "Unknown resource type" }

  #def from_token("User:" <> id), do: { :ok, Repo.get(User, id) }
  def from_token(val) do 
    out = Poison.decode!(val, as: %User{})
    { :ok, Repo.get(User, out.id)}
  end
  #def from_token(_), do: { :error, "Unknown resource type" }

end
