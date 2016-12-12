defmodule Shared.Model.Listing.Meta.Badslava do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :name, :string
    field :event_types, {:array, :string}
    field :categories, {:array, :string}
    field :hosts, {:array, :string}
    field :note, :string
    field :stage_time, {:array, :map}
    embeds_one :sign_up, Shared.Model.Listing.Meta.Badslava.SignUp
    embeds_one :check_in, Shared.Model.Listing.Meta.Badslava.CheckIn
    embeds_one :cost, Shared.Model.Listing.Meta.Badslava.Cost
    embeds_one :performer_limit, Shared.Model.Listing.Meta.Badslava.PerformerLimit
    embeds_one :contact, Shared.Model.Listing.Meta.Badslava.Contact
  end

  @allowed_fields [
    :type, :name, :event_types, :categories, :hosts, :note, :stage_time
  ]

  @required_fields [:type]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> cast_embed(:sign_up)
    |> cast_embed(:check_in)
    |> cast_embed(:cost)
    |> cast_embed(:performer_limit)
    |> cast_embed(:contact)
    |> validate_required(@required_fields)
  end
end