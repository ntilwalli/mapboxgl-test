defmodule Shared.Macro.GeoGeography do
    defmacro st_distance_geog(geometryA, geometryB) do
      quote do: fragment("ST_Distance(?::geography,?::geography)", unquote(geometryA), unquote(geometryB))
    end

    defmacro st_dwithin_geog(geometryA, geometryB, float) do
      quote do: fragment("ST_DWithin(?::geography,?::geography,?)", unquote(geometryA), unquote(geometryB), unquote(float))
    end
end