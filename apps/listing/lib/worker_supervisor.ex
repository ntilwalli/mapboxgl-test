defmodule Listing.Worker.Supervisor do
  use Supervisor

  @name Listing.Worker.Supervisor

  def start_link() do
    Supervisor.start_link(__MODULE__, :ok, name: @name)
  end

  def start_worker(listing) do
    Supervisor.start_child(@name, [listing])
  end

  def stop_worker(pid, reason \\ :normal) do
    Supervisor.terminate_child(pid, reason)
  end

  def init(:ok) do
    children = [
      worker(Listing.Worker, [], restart: :temporary)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end