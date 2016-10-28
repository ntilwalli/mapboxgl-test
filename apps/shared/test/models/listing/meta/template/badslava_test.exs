 defmodule Test.Listing.Meta.Badslava.Template do 
  use ExUnit.Case

  alias Shared.Model.Listing.Meta.Badslava.Template, as: BadslavaTemplate

  test "meta badslava template changeset" do
    bs = %{
      "type" => "badslava",
      "sign_up" => %{
        "start" => -15,
        "styles" => ["list"],
        "methods" => [%{
          "type" => "email_with_upgrade", 
          "data" => %{
            "type" => "additional_stage_time",
            "data" => 1
           }
          }, %{
            "type" => "walk_in"
          }]
      },
      "check_in" => %{
        "start" => -10,
      },
      "cost" => %{
        "type" => "free_plus_upgrade",
        "data" => %{
          "cost" => %{
            "type" => "pay",
            "data" => 2
          },
          "data" => %{
            "type" => "additional_stage_time",
            "data" => 1
          }
        }
      },
      "contact" => %{
        "email" => "thing@t.com",
        "email_name" => "Thing guys",
        "website" => "http://something.com"
      },
      "stage_time" => [%{"type" => "max", "data" => 5}, %{"type" => "range", "data" => [3, 5]}],
      "performer_limit" => %{
        "type" => "limit_with_waitlist",
        "data" => %{
          "limit" => 25,
          "waitlist" => 5
        }
      },
      "host" => ["Sally Shah", "Rajiv Khanna"],
      "note" => "Some note"
    }

    cs = BadslavaTemplate.changeset(%BadslavaTemplate{}, bs)
    #IO.inspect cs
    assert cs.valid? == true
  end

  
  # embedded_schema do
  #   field :type, :string
  #   embeds_one :when, Shared.Model.Listing.Meta.Badslava.StartDuration.Template
  #   embeds_one :sign_up, Shared.Model.Listing.Meta.Badslava.SignUp.Template
  #   embeds_one :check_in, Shared.Model.Listing.Meta.Badslava.StartDuration.Template
  #   embeds_one :cost, Shared.Model.Listing.Meta.Badslava.Cost
  #   embeds_one :contact_info, Shared.Model.Listing.Meta.Badslava.ContactInfo
  #   field :stage_time, {:array, :float}
  #   field :performer_limit, Shared.Model.Listing.Meta.OpenMic.PerformerLimit
  #   field :notes, :string
  # end

end