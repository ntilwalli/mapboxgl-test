defmodule Shared.ChildListing do
  use Shared.Lib, :model

  schema "child_listings" do
    field :sequence_num, :integer, null: false
    belongs_to :listing, Shared.Listing
    belongs_to :parent, Shared.Listing
  end
end