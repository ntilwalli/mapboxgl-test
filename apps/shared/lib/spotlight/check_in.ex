defmodule Shared.CheckIn do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__, :updated_at]}
  @primary_key false
  schema "check_ins" do
    belongs_to :user, Shared.User
    belongs_to :listing, Shared.Listing
    field :geom, Geo.Geometry
    field :inserted_at, :utc_datetime
  end

  @allowed_fields [:user_id, :listing_id, :geom, :inserted_at]
  @required_fields [:user_id, :listing_id, :inserted_at]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end