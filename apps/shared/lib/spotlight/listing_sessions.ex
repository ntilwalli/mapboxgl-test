defmodule Shared.ListingSession do
  use Shared.Lib, :model 

  @derive {Poison.Encoder, except: [:__meta__, :user_id, :user]}
  @primary_key {:id, :id, autogenerate: true}
  @timestamp_opts [type: :utc_datetime, usec: true]
  schema "listing_sessions" do
    field :listing, :map
    embeds_one :properties, ListingSession.Properties
    field :current_step, :string

    belongs_to :user, Shared.User

    timestamps()
  end

  @required_fields [:user_id]
  @allowed_fields [:id, :listing, :user_id, :current_step]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:properties)
    |> assoc_constraint(:user)
  end
end