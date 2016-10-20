defmodule Shared.TestDateTime do
  use Shared.Lib, :model
  import Shared.Helpers

  @primary_key false
  schema "test_date_time" do
    field :flag, :string
    #embeds_one :foo, Shared.Model.TestFoo
    field :foo, :map
  end

  def changeset(schema, params \\ :empty) do
    schema 
    |> cast(params, [:flag, :foo]) 
    #|> cast(params, [:flag]) 
    |> cast_dynamic(:flag, :foo, %{"blah" => Shared.Model.TestFoo})
    #|> cast_embed(:foo, required: true)
    |> inspect_changeset
    |> validate_required([:flag, :foo])

  end
end