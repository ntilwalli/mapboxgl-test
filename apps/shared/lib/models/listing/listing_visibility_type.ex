defmodule Shared.ListingVisibilityType do
  use Shared.Lib, :model
  
  @primary_key {:id, :string, autogenerate: false}
  schema "listing_visibility_type" do
  end
end