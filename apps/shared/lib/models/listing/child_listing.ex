defmodule Shared.ChildListing do
  use Shared.Lib, :model

  @primary_key false
  schema "child_listings" do
    field :sequence_id, :integer, primary_key: true
    field :handle, :string
    belongs_to :listing, Shared.Listing
    belongs_to :parent, Shared.Listing, primary_key: true
  end
end