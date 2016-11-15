defmodule Shared.Message.Outgoing.CheckIn do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :listing_id, :integer
    field :listing_name, :string
    field :listing_datetime, :utc_datetime
    field :check_in_datetime, :utc_datetime
  end

  @required_fields [:listing_id, :listing_name, :listing_datetime, :check_in_datetime]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
  end
end