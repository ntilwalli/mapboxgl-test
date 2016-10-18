defmodule Scraper.Worker do
  use GenServer

  alias Badslava.Scraper
  def start_link do
    GenServer.start_link(__MODULE__, :ok, [])
  end

  def init(:ok) do
    schedule_work()
    {:ok, []}
  end

  def handle_info(:work, state) do
    IO.puts "Processing"
    Badslava.Scraper.run
    schedule_work()
    {:noreply, state}
  end

  defp schedule_work() do
    Process.send_after(self(), :work, 60 * 1000)
  end
end