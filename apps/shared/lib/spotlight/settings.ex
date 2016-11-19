defmodule Shared.Settings do
  use Shared.Lib, :model 

  @derive {Poison.Encoder, except: [:__meta__, :user_id, :user]}
  @primary_key false
  schema "settings" do
    field :use_region, :string
    embeds_one :override_region, Shared.Model.Region
    embeds_one :home_region, Shared.Model.Region
    belongs_to :user, Shared.User, primary_key: true
  end

  @required_fields [:use_region]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:override_region)
    |> cast_embed(:home_region)
    |> assoc_constraint(:user)
  end
end