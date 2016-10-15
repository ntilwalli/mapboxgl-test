defmodule Listing.Profile do
  use Shared.Lib, :model

  alias Listing.Profile.Meta
  # alias Listing.Profile.Description
  # alias Listing.Profile.Location
  # alias Listing.Profile.SearchArea
  # alias Listing.Profile.MapSettings
  # alias Listing.Profile.Time

  @primary_key false
  embedded_schema do
    embeds_one :meta, Meta
    # embeds_one :description, Description
    # embeds_one :location, Location
    # embeds_one :search_area, SearchArea
    # embeds_one :map_settings, MapSettings
    # embeds_one :time, Time
  end
end