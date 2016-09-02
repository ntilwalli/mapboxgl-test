defmodule Shared.GlobalHandle do
  use Shared.Lib, :model

  @primary_key {:handle, :string, autogenerate: false}
  schema "global_handles" do
    belongs_to :listing, Shared.Listing
  end
end