defmodule Shared.ListingSessionManager do
  alias Shared.ListingSession
  alias Shared.Repo

  import Ecto.Query, only: [from: 2, first: 1]
  alias Ecto.Multi

  def add(%{"id" => id} = session, user) when is_number(id) do
    IO.puts "Updating session"
    update_session = Ecto.build_assoc(user, :listing_sessions)
    update_session = %{update_session | id: id}
    listing = session["listing"]

    session_params = %{
      "listing" => session["listing"],
      "search_area" => session["search_area"]
    }

    session_changeset = ListingSession.changeset(update_session, session_params)
    IO.inspect session_changeset
    case Repo.update(session_changeset) do
      {:ok, session} ->
        #IO.inspect session
        %{type: "saved", data: session}
      {:error, %Ecto.Changeset{} = changeset} ->
        #IO.inspect changeset
        %{type: "error", data: %{errors: errors_to_map(changeset.errors)}}
    end
  end

  def add(session, user) do
    IO.puts "Updating session"
    new_session = Ecto.build_assoc(user, :listing_sessions)
    listing = session["listing"]

    session_params = %{
      "listing" => session["listing"],
      "search_area" => session["search_area"]
    }

    session_changeset = ListingSession.changeset(new_session, session_params)

    case Repo.insert(session_changeset) do
      {:ok, session} ->
        #IO.inspect session
        %{type: "created", data: session}
      {:error, %Ecto.Changeset{} = changeset} ->
        #IO.inspect changeset
        %{type: "error", data: %{errors: errors_to_map(changeset.errors)}}
    end
  end

  defp errors_to_map(errors) do
    Enum.into(errors, %{}, fn {k, {e, _}} -> {k, e} end)
  end
end