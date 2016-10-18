defmodule Shared.GuardianToken do
  use Shared.Lib, :model

  alias Shared.Repo

  @primary_key {:jti, :string, []}
  # @derive {Phoenix.Param, key: :jti}
  schema "guardian_tokens" do
    field :aud, :string
    field :iss, :string
    field :sub, :string
    field :exp, :integer
    field :jwt, :string
    field :claims, :map
    field :typ, :string

    timestamps
  end
end
