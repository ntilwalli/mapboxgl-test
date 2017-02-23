defmodule Candle.Email do
  use Bamboo.Phoenix, view: Candle.EmailView
  alias Bamboo.SparkPostHelper

  def welcome_email(user) do
    new_email()
    |> to(user.email)
    |> from("noreply@stumplog.com")
    |> subject("Welcome to Stumplog!")
    |> text_body("#{user.display_name}, you just joined Stumplog! Good call. We're glad to have you!  Stumplog is a community for people who have events and want to share those events with others.  You can find, add, manage, and create a community around events using Stumplog in a way that we believe is unique and will help you grow as an artist, performer or aficionado.  Now that you're on Stumplog we hope you'll have an easier time getting out there, doing stuff, and making it count.\n\nThe Stumplog Team")
    #|> SparkPostHelper.put_param([:options, :sandbox], true)
  end


  def forgotten_password(user) do
    new_email()
    |> to(user.email)
    |> from("noreply@stumplog.com")
    |> subject("Reset password for Stumplog")
    |> text_body("To reset your Stumplog password click the below link.\n\nhttps://www.stumplog.com/i/forgotten\n\nRegards,\nThe Stumplog Team")
    #|> SparkPostHelper.put_param([:options, :sandbox], true)
  end
end