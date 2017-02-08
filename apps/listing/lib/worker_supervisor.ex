defmodule Listing.Worker.Supervisor do
  use Supervisor

  def start_link(name, generator) do
    Supervisor.start_link(__MODULE__, {:ok, generator}, name: name)
  end

  def start_worker(pid, listing, registry_name, notification_manager) do
    Supervisor.start_child(pid, [listing, registry_name, notification_manager])
  end

  def stop_worker(pid, reason \\ :normal) do
    Supervisor.terminate_child(pid, reason)
  end

  def init({:ok, generator}) do
    children = [
      worker(Listing.Worker, [generator], restart: :temporary)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end