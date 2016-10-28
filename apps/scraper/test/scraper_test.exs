defmodule ScraperTest do
  use ExUnit.Case
  doctest Scraper

  # test "badslava listing changeset" do
  #   data = #%Shared.Model.Scraper.BadslavaListing{
  #     %{
  #       type: "badslava",
  #       city: "New York", 
  #       cost: "Paid", 
  #       day: "24", 
  #       email: nil, 
  #       email_name: nil, 
  #       end_time: nil, 
  #       frequency: "Weekly", 
  #       lat: 40.7389512, 
  #       lng: -73.9807881, 
  #       month: "10", 
  #       notes: "$3 cover", 
  #       phone: "(212) 696-5233", 
  #       sign_up: nil, 
  #       sign_up_site: nil, 
  #       start_time: ~T[17:00:00], 
  #       state_abbr: "NY", 
  #       street: "241 East 24th Street", 
  #       title: "Open Mic", 
  #       venue_name: "New York Comedy Club", 
  #       website: "http://www.newyorkcomedyclub.com", 
  #       week_day: "Monday", 
  #       year: "16"
  #     }
  #     l_id = 2671
  #     source = "badslava"
  #     row_data = %{data: data, listing_id: l_id, source: "badslava"}
  #     cs = Shared.Scrapings.changeset(%Shared.Scrapings{}, row_data)
  #     {status, result} = Shared.Repo.insert!(cs) 
  #     assert status == :ok
  # end

  test "run" do
    Scraper.BadslavaScraper.run# drop: true, update: true
  end
end
