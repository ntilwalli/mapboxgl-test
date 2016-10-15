defmodule Listing.Create.Session do
  use Shared.Lib, :model

  @primary_key {:id, :id, autogenerate: true}
  schema "create_listing_sessions" do
    field :sort_id, :id
    embeds_one :session, Shared.Listing
    embeds_one :search_area, Listing.Create.SearchArea

    belongs_to :user, Shared.User

    timestamps
  end

  @allowed_fields [:session, :search_area, :user_id]
  @required_fields [:session, :user_id]
  def changeset(model, params \\ %{}) do
    model
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:session)
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