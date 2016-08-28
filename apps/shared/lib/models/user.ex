defmodule Shared.User do
  use Shared.Lib, :model
  #@derive {Poison.Encoder, except: [:__meta__]}
  schema "users" do
    field :name, :string
    field :username, :string
    field :email, :string
    field :type, :string, default: "individual"

    has_many :authorizations, Shared.Authorization

    timestamps
  end

  @required_fields ~w(name username email type)
  @optional_fields ~w()

  def registration_changeset(model, params \\ :empty) do
    model
    |>cast(params, @required_fields, @optional_fields)
  end

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> validate_format(:email, ~r/@/)
  end

end
