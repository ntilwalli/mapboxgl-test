defmodule Shared.Model.Listing.Meta.Standard do
  use Shared.Lib, :model
  import Shared.Helpers

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :type, :string
    field :name, :string
    field :description, :string
    field :short_description, :string
    field :listed_hosts, {:array, :string}
    embeds_many :listed_performers, Shared.Model.Listing.Meta.Standard.ListedPerformer
    field :note, :string
    field :stage_time, {:array, Shared.Model.Listing.Meta.Standard.StageTime}
  end

  @allowed_fields [
    :type, :name, :description, :short_description,
    :listed_hosts, :note, :stage_time
  ]

  @required_fields [:type, :name, :description]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> cast_embed(:listed_hosts)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, ["recurring", "single"])
    |> Helpers.atomize_type
  end
end