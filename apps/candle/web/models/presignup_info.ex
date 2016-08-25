defmodule Candle.PresignupInfo do
  @derive {Poison.Encoder, except: [:__meta__]}
  defstruct name: "", handle: "", email: nil, type: "individual"
end
