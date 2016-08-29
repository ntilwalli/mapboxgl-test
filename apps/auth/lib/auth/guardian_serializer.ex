defmodule Auth.GuardianSerializer do
  @behaviour Guardian.Serializer

  alias Shared.Repo
  alias Shared.User

  def for_token(%User{} = user) do
     {:ok, Poison.encode!(user)}
  end
  
  def from_token(val) do 
    out = Poison.decode!(val, as: %User{})
    { :ok, Repo.get(User, out.id)}
  end
end
