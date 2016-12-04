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
  const {hour, minute, meridiem} = time
  if (meridiem === 'AM' && hour === 12) {
    return [0, minute]
  } else if (meridiem === 'PM' && hour < 12) {
    return [hour + 12, minute]
  } else {
    return [hour, minute]
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
