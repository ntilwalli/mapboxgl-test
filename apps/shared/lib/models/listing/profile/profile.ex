defmodule Listing.Profile do
  use Shared.Lib, :model

  # alias Listing.Profile.Location
  # alias Listing.Profile.MapSettings
  # alias Listing.Profile.Time

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :name, :string
    field :description, :string
    field :short_description, :string
    embeds_many :event_types, :string
    embeds_many :categories, :string
    # embeds_one :location, Location
    # embeds_one :map_settings, MapSettings
    # embeds_one :time, Time
  end

  @allowed_fields [:name, :description, :short_description, :event_types, :categories]
  @required_fields []

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end