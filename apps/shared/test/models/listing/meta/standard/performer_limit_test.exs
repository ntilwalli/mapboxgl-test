 defmodule Test.Standard.PerformerLimit do 
  use ExUnit.Case
  #@tag :pending

  test "standard performer limit" do
    bs =  %{
      type: "limit_by_sign_up_type",
      data: %{
        in_person: %{
          type: "limit",
          data: 10
        },
        pre_registration: %{
          type: "no_limit",
        }
      },
      enable_waitlist: true
    }

    cs = Standard.PerformerLimit.changeset(%Standard.PerformerLimit{}, bs)
    #IO.inspect cs
    assert cs.valid? == true
  end
end