defmodule Scraper.Worker do
  use GenServer

  def start_link do
    GenServer.start_link(__MODULE__, :ok, [])
  end

  def init(:ok) do
    work()
    schedule_work()
    {:ok, []}
  end

  def handle_info(:work, state) do
    #IO.puts "Processing"
    work()
    schedule_work()
    {:noreply, state}
  end

  defp schedule_work() do
    Process.send_after(self(), :work, 24 * 60 * 60 * 1000)
  end

  defp work() do
    Scraper.BadslavaScraper.run
  end
end