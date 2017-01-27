defmodule Candle.Email do
  use Bamboo.Phoenix, view: Candle.EmailView

  def welcome_text_email(email_address) do
    new_email
    |> to(email_address)
    |> from("postmaster@stumplog.com")
    |> subject("Welcome!")
    |> text_body("Welcome to Stumplog!")
  end
end