defmodule Shared.UserListing do
  use Shared.Lib, :model

  #@primary_key {:id, :id, autogenerate: true}
  schema "user_listings" do
    field :sequence_num, :integer
    field :handle, :string

    belongs_to :user, Shared.User
    belongs_to :listing, Shared.Listing
  end
end