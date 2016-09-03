defmodule User.Auth do
  use GenServer
  use Timex

  alias Shared.Listing
  alias Shared.Repo
  
  def start_link(args, opts \\ []) do
    # IO.puts "Printing"
    # IO.inspect args
    GenServer.start_link(__MODULE__, args, [])
  end

  def route(server, message) do
    GenServer.call(server, message)
  end

  def init([{:user, user}] = args) do
    {:ok, %{
      user: user
    }}
  end

  def handle_call(%{"route" => "/listing/save", "data" => listing}, _from, %{user: user} = state) do
    IO.puts "Got listing with no id"
    IO.inspect listing


    id = Map.get(listing, "id")
    parent_id = Map.get(listing, "parentId")
    type = Map.fetch!(listing, "type")
    profile = Map.fetch!(listing, "profile")

    listing = Ecto.build_assoc(user, :listings)

    case id do
      nil ->
        IO.puts "Create new listing"
        params = %{
          "parent_id" => parent_id,
          "type" => type,
          "profile" => profile,
          "inserted_at" => Timex.now
        }

        changeset = Listing.insert_changeset(listing, params)
        IO.puts "Changeset:"
        IO.inspect changeset
        case Repo.insert(changeset) do
          {:ok, val} -> 
            IO.puts "insert ok"
            IO.inspect val
            {:reply, {:ok, %{type: "success"}}, state}
          {:error, val} -> 
            IO.puts "insert error"
            IO.inspect val
            {:reply, {:ok, %{type: "error"}}, state}
        end
      val ->
        IO.puts "Update existing listing"
        params = %{
          "id" => val,
          "parent_id" => parent_id,
          "type" => type,
          "profile" => profile,
          "inserted_at" => Timex.now
        }

        changeset = Listing.update_changeset(listing, params)
        IO.puts "Changeset:"
        IO.inspect changeset
        case Repo.update(changeset) do
          {:ok, val} -> 
            IO.puts "update ok"
            IO.inspect val
            {:reply, {:ok, %{type: "success"}}, state}
          {:error, val} -> 
            IO.puts "update error"
            IO.inspect val
            {:reply, {:ok, %{type: "error"}}, state}
        end
    end
  end

end