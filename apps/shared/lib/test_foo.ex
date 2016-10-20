defmodule Shared.Model.TestFoo do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :bar, :time
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, [:bar])
    |> validate_required([:bar])
  end
end