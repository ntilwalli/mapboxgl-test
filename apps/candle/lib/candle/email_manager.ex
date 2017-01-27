defmodule Candle.EmailManager do
  use GenServer

  def start_link(name) do
    GenServer.start_link(__MODULE__, :ok, name: name)
  end

  def forgotten_password(server, user) do
    GenServer.call(server, {:forgotten_password, user})
  end

  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:forgotten_password, user}, _from, state) do
    IO.inspect {:reset_password, user.username}
    #Candle.Email.welcome_text_email("ntilwalli@gmail.com") |> Candle.Mailer.deliver_later
    {:reply, :ok, state}
  end
end