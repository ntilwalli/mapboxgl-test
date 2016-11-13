defimpl Poison.Encoder, for: Shared.CheckIn do
  def encode(%Shared.CheckIn{} = val, options) do
    %{user: user, geom: geom, inserted_at: inserted_at} = val |> Shared.Repo.preload(:user)
    
    out = "{\"user\":#{Poison.encode!(user)},\"position\":#{Geo.JSON.encode(geom) |> Poison.encode!},\"time\":#{Poison.encode!(inserted_at)}}"
    IO.puts "Encode check-in"
    IO.inspect(out)
    Poison.Encoder.BitString.encode("{}", options)
  end
end