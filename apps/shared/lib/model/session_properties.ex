defmodule Shared.Model.SessionProperties do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_one :search_area, Shared.Model.SearchArea
    field :rrule_string, :string
  end

  @required_fields [:radius]
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields)
    |> validate_required(@required_fields)
    |> cast_embed(:region, required: true)
  end
end