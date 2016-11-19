defmodule Shared.Model.Geotag do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :city, :string
    field :state_abbr, :string
    field :country_abbr, :string
  end

  @required_fields [:city, :state_abbr]
  @allowed_fields [:city, :state_abbr, :country_abbr]
  def changeset(model, params \\ %{}) do
    model
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end