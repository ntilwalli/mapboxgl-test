defmodule Shared.Model.Scraper.BadslavaListing do
  use Shared.Lib, :model

  @derive {Poison.Encoder, except: [:__meta__]}
  @primary_key false
  embedded_schema do 
    field :type, :string
    field :name, :string
    field :week_day, :string
    field :frequency, :string 
    field :venue_name, :string 
    field :street, :string
    field :city, :string
    field :state_abbr, :string
    field :website, :string
    field :note, :string 
    field :start_time, :time 
    field :end_time, :time
    field :cost, :string
    field :sign_up, :time
    field :sign_up_site, :string
    field :phone, :string
    field :email, :string
    field :email_name, :string
    field :lat, :float
    field :lng, :float 
    field :month, :string
    field :day, :string 
    field :year, :string
  end

  @allowed_fields [ :type,
    :name, :week_day, :frequency, :venue_name,
    :street, :city, :state_abbr, :website, :note, :start_time,
    :end_time, :cost, :sign_up, :sign_up_site, :phone, :email,
    :email_name, :lat, :lng, :month, :day, :year
  ]

  @required_fields [ :type,
    :name, :week_day, :frequency, :venue_name,
    :street, :city, :state_abbr, :start_time,
    :lat, :lng
]

  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> validate_required(@required_fields)
  end
end