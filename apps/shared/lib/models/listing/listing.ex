defmodule Shared.Listing do
  use Shared.Lib, :model

  @primary_key {:id, :id, autogenerate: true}
  schema "listings" do
    field :parent_id, :id
    field :profile, :map
    field :is_group, :boolean

    belongs_to :user, Shared.User
    has_one :user_listings, Shared.UserListing
    has_one :child_listings, Shared.ChildListing
    has_one :global_handles, Shared.GlobalHandle

  end
end