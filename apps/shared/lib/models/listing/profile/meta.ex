defmodule Listing.Profile.Meta do
  use Shared.Lib, :model

  @primary_key false
  embedded_schema do
    field :visibility, :string
    field :event_type, :string
  end
end