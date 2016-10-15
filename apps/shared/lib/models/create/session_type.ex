defmodule Create.SessionType do
  use Shared.Lib, :model
  
  @primary_key {:id, :string, autogenerate: false}
  schema "session_type" do
  end
end