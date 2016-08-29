defmodule Auth.Credential do
  @derive {Poison.Encoder, only: [:username]}
  defstruct [:username, :password]
end