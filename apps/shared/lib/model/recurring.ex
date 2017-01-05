defmodule Shared.Model.Recurring do
  use Shared.Lib, :model
  #import Timex

  @derive {Poison.Encoder, exclude: [:__meta__]}
  @primary_key false
  embedded_schema do
    field :rdate, {:array, :naive_datetime}
    embeds_many :rrules, Shared.Model.RRule
    field :exdate, {:array, :naive_datetime}
    field :duration, :float
  end

  @allowed_fields [:rdate, :exdate, :duration]
  @required_fields []
  def changeset(schema, params \\ :empty) do
    schema
    |> cast(params, @allowed_fields)
    |> cast_embed(:rrules)
  end


  def between(%Shared.Model.Recurring{} = recurrable, start_datetime, end_datetime, tz) do
    recurrences = recurrable.rrules
      |> Enum.flat_map(fn rrule -> single_between(rrule, start_datetime, end_datetime, tz) end) 
      |> Enum.uniq_by(fn x -> 
          {:ok, val, _, _} = Calendar.NaiveDateTime.diff(x, end_datetime)
          val
      end)

    with_rdate = case recurrable.rdate do
      nil -> recurrences
      val ->
        rdate_normalized = val 
          |> Enum.filter(fn x -> 
            {:ok, _, _, after_status} = Calendar.NaiveDateTime.diff(x, start_datetime)
            {:ok, _, _, before_status} = Calendar.NaiveDateTime.diff(x, end_datetime)

            (after_status == :after or after_status == :same_time) and 
              (before_status == :before or before_status == :same_time)
          end)
        (recurrences ++ rdate_normalized)
          |> Enum.sort(&Calendar.NaiveDateTime.before?/2)
    end

    with_exdate = case recurrable.exdate do
      nil -> with_rdate
      val ->
        with_rdate 
          |> Enum.filter(
            fn x -> not Enum.any?(
              val, 
              fn y -> 
                {:ok, _, _, status} = Calendar.NaiveDateTime.diff(x, end_datetime)
                status == :same_time
              end
            ) 
          end)
    end

    #IO.inspect with_exdate
    with_exdate

  end

  def single_between(%Shared.Model.RRule{} = rrule, start_datetime, end_datetime, tz) do
    now_dt = Calendar.DateTime.to_naive(Calendar.DateTime.now! tz)
    freq = rrule.freq

    dtstart = case rrule.dtstart do
      nil -> now_dt
      val -> val
    end

    recurrences = case freq do
      "weekly" ->
        case rrule.interval do
          nil -> 
            gen_weekly(dtstart, start_datetime, end_datetime)
          val ->
            unfiltered = gen_weekly(dtstart, start_datetime, end_datetime)
            Enum.take_every(unfiltered, val)
        end
      "monthly" ->
        bysetpos = rrule.bysetpos
        byweekday = rrule.byweekday
        month = dtstart.month
        year = dtstart.year

        # IO.inspect month
        # IO.inspect year
        # IO.inspect bysetpos
        # IO.inspect byweekday

        time = Calendar.NaiveDateTime.to_time(dtstart)

        month_years = gen_series(dtstart, start_datetime, end_datetime, 1) 
          |> Enum.map(fn x -> 
            {x.year, x.month} 
          end)
          |> Enum.uniq
          # |> Enum.map(fn x -> 
          #     IO.puts "After uniq"
          #     IO.inspect x
          #     x
          #   end)
          |> Enum.flat_map(fn {year, month} -> 
              # IO.inspect year
              # IO.inspect month
              # IO.inspect time
              # IO.inspect byweekday
              # IO.inspect bysetpos
              unfiltered = gen_monthly(year, month, time, byweekday, tz)
              Enum.map(bysetpos, fn x -> 
                if x < 0 do
                  Enum.at(unfiltered, x)
                else
                  Enum.at(unfiltered, x-1)
                end
              end)
             end)
             |> Enum.filter(fn x -> not is_nil(x) end)
          # |> Enum.map(fn x -> 
          #     IO.puts "Before filter"
          #     IO.inspect x
          #     x
          #   end)
          |> Enum.filter(fn x -> 
            # IO.puts "Monthly"
            # IO.inspect x
            {:ok, _, _, after_status} = Calendar.NaiveDateTime.diff(x, start_datetime)
            {:ok, _, _, before_status} = Calendar.NaiveDateTime.diff(x, end_datetime)
            (after_status == :after or after_status == :same_time) and 
              (before_status == :before or before_status == :same_time)
            end)
      _ -> raise ArgumentError, message: "freq: #{freq} is unsupported"
    end

    recurrences
  end

  defp gen_monthly(year, month, time, weekdays, tz) do
    {:ok, seed_date} = Date.new(year, month, 1)
    days_in_month = Calendar.Date.number_of_days_in_month(seed_date)
    {:ok, end_date} = Date.new(year, month, days_in_month)
    {:ok, seed_datetime} = NaiveDateTime.new(seed_date, time)
    {:ok, end_of_month} = NaiveDateTime.new(end_date, ~T[23:59:59.999999])
    # IO.inspect seed_datetime
    # IO.inspect end_of_month
    unfiltered = gen_daily(seed_datetime, seed_datetime, end_of_month)
    # IO.inspect unfiltered
    filtered = unfiltered |> Enum.filter(fn x -> (Calendar.Date.day_of_week_name(x) |> String.downcase) in weekdays end)
    #IO.inspect filtered
  end

  defp gen_daily(curr, start_dt, end_dt) do
    # IO.inspect curr
    # IO.inspect start_dt
    # IO.inspect end_dt
    out = gen_series(curr, start_dt, end_dt, 1)
    # IO.inspect out
  end

  defp gen_weekly(curr, start_dt, end_dt) do
    gen_series(curr, start_dt, end_dt, 7)
  end

  defp gen_series(curr, start_dt, end_dt, increment, out_val \\ []) do
    {:ok, _, _, after_status} = Calendar.NaiveDateTime.diff(curr, start_dt)
    cond do
      after_status == :after or after_status == :same_time ->
        {:ok, _, _, before_status} = Calendar.NaiveDateTime.diff(curr, end_dt)
        cond do
          before_status == :before -> gen_series(Calendar.NaiveDateTime.add!(curr, increment*24*60*60), start_dt, end_dt, increment, out_val ++ [curr])
          before_status == :same_time -> out_val ++ [curr]
          true -> out_val
        end
      true -> out_val
    end
  end
end