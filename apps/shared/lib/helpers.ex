defmodule Shared.Helpers do
  import Ecto
  import Ecto.Changeset
  alias Timex.Ecto
  alias Ecto.Changeset
  alias Shared.Manager.TimezoneManager

  def cast_dynamic(changeset, flag_key, dynamic_key, processors, opts \\ :empty) 
    when is_atom(flag_key) and is_atom(dynamic_key) do
    case changeset do
      %{valid?: true, changes: changes, data: data} ->
        flag = 
          with nil <- Map.get(changes, flag_key),
               nil <- Map.get(data, flag_key),
               do: raise ArgumentError, message: "flag property does not resolve"

          case Map.get(changes, dynamic_key) do
            nil -> 
              case Keyword.get(opts, :required) do
                nil -> changeset
                _ ->  %{changeset |> add_error(dynamic_key, "is required") | valid?: false}
                end
            dynamic_val -> 
              case Map.get(processors, flag) do
                nil -> 
                  %{changeset |> add_error(dynamic_key, "Could not find match for \"#{flag}\" in cast_dynamic processors") | valid?: false}
                module -> 
                  dynamic_cs = apply(module, :changeset, [struct(module), dynamic_val])

                  case dynamic_cs do
                    #%{valid?: true} -> changeset |> put_change(dynamic_key, dynamic_cs)
                    %{valid?: true} -> changeset |> put_change(dynamic_key, dynamic_cs |> apply_changes |> flatten_struct)
                    _ ->  %{changeset |> put_change(dynamic_key, dynamic_cs) | valid?: false}
                  end
              end
          end 
      _ -> changeset
    end
  end

  def validate_require_one(changeset, keys, _opts \\ :empty) when is_list(keys) do
    changes = changeset.changes
    data = changeset.data
    
    valid_changes_keys = Map.to_list(changes) 
      |> Enum.filter(fn x -> !is_nil(elem(x, 1)) end)
      |> Enum.map(fn x -> elem(x, 0) end)
      |> MapSet.new
    valid_data_keys = Map.to_list(data) 
      |> Enum.filter(fn x -> !is_nil(elem(x, 1)) end)
      |> Enum.map(fn x -> elem(x, 0) end)
      |> MapSet.new

    intersected_keys = MapSet.intersection(
      MapSet.new(keys),
      MapSet.union(valid_data_keys, valid_changes_keys)
    ) |> Enum.to_list

    changeset = %{changeset | validations: [changeset.validations | :validate_require_one]}
    case intersected_keys do
      [] -> %{changeset |> add_error(:validate_require_one, "requires one of provided keys") | valid?: false}
      _ -> changeset
    end
  end

  def add_timezone(changeset) do
    changes = changeset.changes
    data = changeset.data
    has_lat_lng = MapSet.new([:lat, :lng]) 
      |> MapSet.subset?(Map.keys(changes) |> MapSet.new)
    
    #IO.inspect has_lat_lng
    has_timezone = Map.keys(data) 
      |> Enum.any?(fn x -> x == :timezone end)
    #IO.inspect has_timezone
    case has_lat_lng and has_timezone do
      true -> 
        case TimezoneManager.get({changes.lng, changes.lat}) do
          nil -> %{changeset |> add_error(:add_timezone, "Timezone not found") | valid?: false}
          tz -> changeset |> put_change(:timezone, tz)
        end
      false -> 
        msg = "changes requires :lat, :lng keys, data requires :timezone key"
        %{changeset |> add_error(:add_timezone, msg) | valid?: false}
    end
  end

  def inspect_changeset(changeset) do
    IO.inspect changeset
  end

  defp flatten_struct(%{__struct__: _} = somestruct) do
    flatstruct = Map.to_list(somestruct) 
      |> Enum.map(fn x -> 
          case elem(x, 1) do
            val when is_list(val) -> for v <- val, do: get_flattened_val(v)
            %{__struct__: _} = val -> {elem(x, 0), get_flattened_val(val)}
            _ -> x
          end
        end) 
      |> Enum.into(%{})
    
    Map.from_struct(flatstruct)
  end

  defp get_flattened_val(cs) do
    case cs do
      %Date{} = dt -> Date.to_iso8601(dt)
      %Time{} = dt -> Time.to_iso8601(dt)
      %DateTime{} = dt -> DateTime.to_iso8601(dt)
      _ -> Map.from_struct(cs)
    end
  end
end