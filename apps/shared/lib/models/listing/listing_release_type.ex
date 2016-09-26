defmodule Shared.ListingReleaseType do
  use Shared.Lib, :model
  
  @primary_key {:id, :string, autogenerate: false}
  schema "listing_release_type" do
  end
end