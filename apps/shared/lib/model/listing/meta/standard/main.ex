defmodule Meta.Standard do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :name, :string
    field :description, :string
    field :event_types, {:array, :string}
    field :categories, {:array, :string}
    field :note, :string
    field :short_description, :string
    field :listed_hosts, {:array, :string}
    embeds_many :listed_performers, Standard.ListedPerformer
    embeds_many :stage_time, Standard.StageTime
    embeds_one :performer_sign_up, Standard.PerformerSignUp
    embeds_one :performer_check_in, Standard.PerformerCheckIn
    embeds_one :performer_limit, Standard.PerformerLimit
    embeds_many :performer_cost, Standard.Cost
    embeds_one :contact_info, Standard.ContactInfo
    embeds_one :audience_cost, Standard.Cost
  end

  @allowed_fields [
    :type, :name, :description, :short_description,
    :listed_hosts, :note, :event_types, :categories
  ]

  @required_fields [:type]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, ["standard"])
    |> cast_embed(:listed_performers)
    |> cast_embed(:stage_time)
    |> cast_embed(:performer_sign_up)
    |> cast_embed(:performer_check_in)
    |> cast_embed(:performer_limit)
    |> cast_embed(:performer_cost)
    |> cast_embed(:contact_info)
    |> cast_embed(:audience_cost)
  end
end