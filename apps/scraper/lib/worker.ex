defmodule Scraper.Worker do
  use GenServer

  def start_link do
    GenServer.start_link(__MODULE__, :ok, [])
  end

  def init(:ok) do
    schedule_work(1)
    {:ok, []}
  end

  def handle_info(:work, state) do
    #IO.puts "Processing"
    #work()
    schedule_work(12 * 60 * 60)
    {:noreply, state}
  end

  defp schedule_work(wait_duration) do
    Process.send_after(self(), :work, wait_duration * 1000)
  end

  defp work() do
    Scraper.BadslavaScraper.V2.run
  end
end