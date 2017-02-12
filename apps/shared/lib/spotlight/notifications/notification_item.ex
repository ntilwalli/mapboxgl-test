defmodule Shared.NotificationItem do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__, :user, :user_group]}
  @primary_key {:id, :id, autogenerate: true}
  schema "notification_items" do
    field :sort_id, :id
    field :object, :id, null: false
    field :actions, {:array, :map}, null: false
    field :subjects, {:array, :id}, null: false
    belongs_to :user, Shared.User
    belongs_to :user_group, Shared.User, foreign_key: :behalf_of
    timestamps()
  end

  @allowed_fields [:object, :actions, :subjects, :user_id, :behalf_of]
  @required_fields [:object, :actions, :subjects, :user_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> assoc_constraint(:user)
  end
end 