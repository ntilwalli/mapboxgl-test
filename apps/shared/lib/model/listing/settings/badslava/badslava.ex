defmodule Shared.Model.Listing.Settings.Badslava do
  use Shared.Lib, :model
  import Shared.Helpers

  alias Shared.Model.Listing.Settings.Badslava.CheckIn

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    embeds_one :check_in, CheckIn
  end

  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> cast_embed(:check_in)
    |> validate_required(@required_fields)
  end
end