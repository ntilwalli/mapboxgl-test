defmodule Shared.Notification do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key {:id, :id, autogenerate: true}
  schema "notifications" do
    field :read_at, :utc_datetime
    belongs_to :user, Shared.User
    belongs_to :item, Shared.NotificationItem
    timestamps()
  end

  @allowed_fields [:id, :read_at, :user_id, :item_id]
  @required_fields [:user_id, :item_id]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> assoc_constraint(:user)
    |> assoc_constraint(:item)
  end
end 