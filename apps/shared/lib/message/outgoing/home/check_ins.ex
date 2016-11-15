defmodule Shared.Message.Outgoing.Home.CheckIns do
  use Shared.Lib, :model

  alias Shared.Message.Outgoing.CheckIn, as: CheckInItem

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do
    embeds_many :check_ins, CheckInItem
  end

  def changeset(schema, params \\ :empty) do
    schema
    |> cast_embed(:check_ins, required: true)
  end
end