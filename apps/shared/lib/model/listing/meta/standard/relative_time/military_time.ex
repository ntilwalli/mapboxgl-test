defmodule Standard.MilitaryTime do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :hour, :integer
    field :minute, :integer  
  end

  @fields [:hour, :minute]
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @fields)
    |> validate_required(@fields)
    |> validate_inclusion(:hour, 0..23)
    |> validate_inclusion(:minute, 0..59)
  end
end