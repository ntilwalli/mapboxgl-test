defmodule Shared.User do
  use Shared.Lib, :model

  @derive {Poison.Encoder, only: [:id, :name, :username]}
  schema "users" do
    field :name, :string
    field :username, :string
    field :email, :string
    field :type, :string, default: "individual"

    has_many :authorizations, Shared.Authorization
    has_many :listings, Shared.Listing
    has_many :user_child_listings, Shared.UserChildListing
    has_many :check_ins, Shared.CheckIn
    has_one :settings, Shared.Settings
    has_many :listing_sessions, Shared.ListingSession

    has_many :notification_items, Shared.NotificationItem
    has_many :notification_items_on_behalf_of, Shared.NotificationItem
    has_many :notifications, Shared.Notification
    timestamps()
  end

  @required_fields ~w(name username email type)
  @optional_fields ~w()

  def registration_changeset(model, params \\ :empty) do
    model
    |>cast(params, @required_fields, @optional_fields)
  end

  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> validate_format(:email, ~r/@/)
  end
end
