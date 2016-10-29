defmodule Shared.Model.Decoders do
  import Ecto.Changeset, only: [apply_changes: 1]
  alias Shared.Model.Listing.Donde.Badslava, as: DondeBadslava
  alias Shared.Model.Listing.Cuando.Once, as: CuandoOnce
  def decode_donde(val) do
    case val["type"] do
      "badslava" -> 
        donde_cs = DondeBadslava.changeset(%DondeBadslava{}, val)
        apply_changes(donde_cs)
      _ -> raise ArgumentError, message: "Donde.Badslava is only supported type"
    end
  end

  def decode_cuando(type, val) do
    case type do
      "recurring" ->
        cuando_cs = Shared.Model.Recurring.changeset(%Shared.Model.Recurring{}, val)
        apply_changes(cuando_cs)
      "single" -> 
        cuando_cs = CuandoOnce.changeset(%CuandoOnce{}, val)
        apply_changes(cuando_cs)
      _ -> raise ArgumentError, message: "Invalid type of Cuando given"
    end
  end
end