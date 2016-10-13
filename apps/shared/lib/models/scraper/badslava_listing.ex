defmodule Scraper.BadslavaListing do
    
  @derive {Poison.Encoder, except: [:__meta__]}
  defstruct name: nil,
    week_day: nil,
    frequency: nil, 
    venue_name: nil, 
    street: nil,
    city: nil,
    state_abbr: nil,
    website: nil, 
    notes: nil, 
    start_time: nil, 
    end_time: nil, 
    cost: nil, 
    sign_up: nil,
    sign_up_site: nil,
    phone: nil, 
    email: nil, 
    email_name: nil, 
    lat: nil, 
    lng: nil, 
    month: nil, 
    day: nil, 
    year: nil
end