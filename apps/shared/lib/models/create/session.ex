defmodule Create.Session do
  use Shared.Lib, :model

  @primary_key {:id, :id, autogenerate: true}
  schema "create_sessions" do
    field :sort_id, :id
    field :type, :string
    field :info, :map

    belongs_to :user, Shared.User

    timestamps
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