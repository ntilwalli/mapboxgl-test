defmodule Shared.Model.Listing.Meta.Badslava.Template do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :hosts, {:array, :string}
    field :note, :string
    field :stage_time, {:array, :map}
    embeds_one :sign_up, Shared.Model.Listing.Meta.Badslava.SignUp.Template
    embeds_one :check_in, Shared.Model.Listing.Meta.Badslava.CheckIn.Template
    embeds_one :cost, Shared.Model.Listing.Meta.Badslava.Cost
    #field :cost, :map
    embeds_one :performer_limit, Shared.Model.Listing.Meta.Badslava.PerformerLimit
    #field :performer_limit, :map
    embeds_one :contact, Shared.Model.Listing.Meta.Badslava.Contact
  end

  @allowed_fields [
    :type, :hosts, :stage_time, :note
  ]
  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> cast_embed(:sign_up)
    |> cast_embed(:check_in)
    |> cast_embed(:contact)
    |> cast_embed(:cost)
    |> cast_embed(:performer_limit)
    |> validate_required(@required_fields)
  end
end