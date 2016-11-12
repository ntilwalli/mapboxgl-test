defmodule Candle.Auth.Helpers do
  def convert_error(:username_already_taken) do
    %{"type" => "username", "error" => "Username already taken"}
  end
  def convert_error(:password_does_not_match) do
    %{"type" => "general", "error" => "Invalid username/password"}
  end
  def convert_error(:invalid_username_password) do
    %{"type" => "general", "error" => "Invalid username/password"}
  end
  def convert_error(:not_found) do
    %{"type" => "general", "error" => "Invalid username/password"}
  end
  def convert_error(error) do
    %{"type" => "general", "error" => "General error"}
  end

  def reset_cookies(conn) do
    conn
    |> Plug.Conn.put_resp_cookie("suggested_name", "", max_age: -1)
    |> Plug.Conn.put_resp_cookie("authorization", "", max_age: -1)
    #|> Plug.Conn.put_resp_cookie("aid", "", max_age: -1)
  end
end
