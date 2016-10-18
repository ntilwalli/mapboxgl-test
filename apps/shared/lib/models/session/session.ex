defmodule Shared.ListingSession do
  use Shared.Lib, :model

  alias Shared.User
  alias ListingSession.Listing
  alias ListingSession.SearchArea

  @derive {Poison.Encoder, only: [:id, :user_id, :listing, :search_area, :inserted_at, :updated_at]}
  @primary_key {:id, :id, autogenerate: true}
  schema "listing_sessions" do
    embeds_one :listing, Listing
    embeds_one :search_area, SearchArea

    belongs_to :user, User

    timestamps
  end

  @allowed_fields [:id, :user_id]
  @required_fields [:user_id]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:listing)
    |> cast_embed(:search_area)
  end


  # @allowed_fields [:id, :user_id, :info]
  # @required_fields_insert  [:user_id, :info, :type]
  # @required_fields_update  [:id, :user:info]

  # def insert_listing_session_changeset(model, params \\ :empty) do
  #   model
  #   |> cast(params, @allowed_fields)
  #   |> validate_required(@required_fields_insert)
  #   |> assoc_constraint(:user)
  #   |> foreign_key_constraint(:type)

  # end

  # def update_changeset(model, params \\ :empty) do
  #   model
  #   |> cast(params, @allowed_fields)
  #   |> validate_required(@required_fields_update)
  #   |> assoc_constraint(:user)
  #   |> foreign_key_constraint(:release)
  #   |> foreign_key_constraint(:visibility)
  # end

end