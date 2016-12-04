import moment = require('moment')

export function get12HourTime(time) {
  if (time.hour() >= 12) {
    return {
      hour: time.hour() === 12 ? 12 : time.hour() - 12,
      minute: time.minute(),
      mode: 'PM'
    }
  } else {
    return {
      hour: time.hour() === 0 ? 12 : time.hour(),
      minute: time.minute(),
      mode: 'AM'
    }
  }
}

function toMilitary(time) {
  const {hour, minute, mode} = time
  if (mode === 'AM') {
    if (hour === 12) {
      return [0, minute]
    } else {
      return [hour, minute]
    }
  } else {
    if (hour === 12) {
      return [hour, minute]
    } else {
      return [hour + 12, minute]
    }
  }
}

export function getDatetime(date, time) {
  if (date) {
    if (time) {
      const [hour, minute] = toMilitary(time)
      return date.clone().hour(hour).minute(minute)
    } else {
      return date.clone().startOf('day')
    }

  } else {
    return moment().startOf('day')
  }
}
