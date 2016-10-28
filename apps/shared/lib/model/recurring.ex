defmodule Shared.Model.Recurring do
  use Shared.Lib, :model
  #import Timex

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :rdate, {:array, :naive_datetime}
    embeds_one :rrule, Shared.Model.RRule
    field :exdate, {:array, :naive_datetime}
    field :duration, :integer
  end

  @allowed_fields [:rdate, :exdate, :duration]
  @required_fields []
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> cast_embed(:rrule)
  end

  def between(%Shared.Model.Recurring{} = recurrable, start_datetime, end_datetime, tz) do
    rrule = recurrable.rrule
    freq = rrule.freq
    now_tz = Calendar.DateTime.now! tz
    dtstart_tz = case rrule.dtstart do
      nil -> now_tz
      val -> 
        {:ok, val_tz} = Calendar.DateTime.from_naive(val, tz)
        val_tz
    end

    {:ok, start_tz} = Calendar.DateTime.from_naive(start_datetime, tz)
    {:ok, end_tz} = Calendar.DateTime.from_naive(end_datetime, tz)

    recurrences = case freq do
      "weekly" ->
        case rrule.interval do
          nil -> 
            gen_weekly(dtstart_tz, start_tz, end_tz)
          val ->
            unfiltered = gen_weekly(dtstart_tz, start_tz, end_tz)
            Enum.take_every(unfiltered, val)
        end
      "monthly" ->
        bysetpos = rrule.bysetpos
        byweekday = rrule.byweekday
        month = dtstart_tz.month
        year = dtstart_tz.year

        # IO.inspect month
        # IO.inspect year
        # IO.inspect bysetpos
        # IO.inspect byweekday

        time = Calendar.DateTime.to_time(dtstart_tz)

        month_years = gen_series(dtstart_tz, start_tz, end_tz, 28) 
          |> Enum.map(fn x -> {x.year, x.month} end)
          |> Enum.uniq
          |> Enum.flat_map(fn {year, month} -> 
              unfiltered = gen_monthly(year, month, time, byweekday, tz)
              Enum.map(bysetpos, fn x -> 
                if x < 0 do
                  Enum.at(unfiltered, x)
                else
                  Enum.at(unfiltered, x-1)
                end
              end)
             end) 
          |> Enum.filter(fn x -> 
            {:ok, _, _, after_status} = Calendar.DateTime.diff(x, start_tz)
            {:ok, _, _, before_status} = Calendar.DateTime.diff(x, end_tz)
            (after_status == :after or after_status == :same_time) and 
              (before_status == :before or before_status == :same_time)
            end)
      _ -> raise ArgumentError, message: "freq: #{freq} is unsupported"
    end

    with_rdate = case recurrable.rdate do
      nil -> recurrences
      val ->
        rdate_normalized = val 
          |> Enum.map(fn x -> 
            {:ok, x_dt} = Calendar.DateTime.from_naive(x, tz) 
            x_dt
          end)
          |> Enum.filter(fn x -> 
            {:ok, _, _, after_status} = Calendar.DateTime.diff(x, start_tz)
            {:ok, _, _, before_status} = Calendar.DateTime.diff(x, end_tz)

            (after_status == :after or after_status == :same_time) and 
              (before_status == :before or before_status == :same_time)
          end)
        (recurrences ++ rdate_normalized)
          |> Enum.sort(&Calendar.DateTime.before?/2)
    end

    with_exdate = case recurrable.exdate do
      nil -> with_rdate
      val ->
        exdate_n = val 
          |> Enum.map(fn x -> 
            {:ok, x_dt} = Calendar.DateTime.from_naive(x, tz) 
            x_dt
          end)

        with_rdate 
          |> Enum.filter(
            fn x -> not Enum.any?(
              exdate_n, 
              fn y -> 
                {:ok, _, _, status} = Calendar.DateTime.diff(x, end_tz)
                status == :same_time
              end
            ) 
          end)
    end

    #IO.inspect with_exdate
    with_exdate
  end

  defp gen_monthly(year, month, time, weekdays, tz) do
    {:ok, seed_date} = Date.new(year, month, 1)
    days_in_month = Calendar.Date.number_of_days_in_month(seed_date)
    {:ok, end_date} = Date.new(year, month, days_in_month)
    {:ok, seed_datetime} = NaiveDateTime.new(seed_date, time)
    {:ok, end_of_month} = NaiveDateTime.new(end_date, ~T[23:59:59.999999])
    {:ok, seed_datetime_tz} = Calendar.DateTime.from_naive(seed_datetime, tz)
    {:ok, end_of_month_tz} = Calendar.DateTime.from_naive(end_of_month, tz)


    unfiltered = gen_daily(seed_datetime_tz, seed_datetime_tz, end_of_month_tz)
    filtered = unfiltered |> Enum.filter(fn x -> (Calendar.Date.day_of_week_name(x) |> String.downcase) in weekdays end)
  end

  defp gen_daily(curr, start_tz, end_tz) do
    gen_series(curr, start_tz, end_tz, 1)
  end

  defp gen_weekly(curr, start_tz, end_tz) do
    gen_series(curr, start_tz, end_tz, 7)
  end

  defp gen_series(curr, start_tz, end_tz, increment, out_val \\ []) do
    {:ok, _, _, after_status} = Calendar.DateTime.diff(curr, start_tz)
    cond do
      after_status == :after or after_status == :same_time ->
        {:ok, _, _, before_status} = Calendar.DateTime.diff(curr, end_tz)
        cond do
          before_status == :before -> gen_series(Calendar.DateTime.add!(curr, increment*24*60*60), start_tz, end_tz, increment, out_val ++ [curr])
          before_status == :same_time -> out_val ++ [curr]
          true -> out_val
        end
      true -> out_val
    end
  end
end