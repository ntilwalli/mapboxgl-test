defmodule Scraper.BadslavaListing do
  use Shared.Lib, :model
  
  import Timex.Ecto.Time
  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do 
    field :name, :string
    field :week_day, :string
    field :frequency, :string 
    field :venue_name, :string 
    field :street, :string
    field :city, :string
    field :state_abbr, :string
    field :website, :string
    field :notes, :string 
    field :start_time, :string 
    field :end_time, :string
    field :cost, :string
    field :sign_up, :string
    field :sign_up_site, :string
    field :phone, :string
    field :email, :string
    field :email_name, :string
    field :lat, :string
    field :lng, :string 
    field :month, :string
    field :day, :string 
    field :year, :string
  end
end