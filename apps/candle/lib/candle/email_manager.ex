defmodule Candle.EmailManager do
  use GenServer

  def start_link(name) do
    GenServer.start_link(__MODULE__, :ok, name: name)
  end

  def forgotten_password(server, user, token) do
    GenServer.call(server, {:forgotten_password, user, token})
  end

  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:forgotten_password, user, token}, _from, state) do
    IO.inspect {:reset_password, user.username}
    Candle.Email.forgotten_password(user, token) 
      |> Candle.Mailer.deliver_later

    {:reply, :ok, state}
  end
end