import {isInteger} from '../utils'
import moment = require('moment')

export function to12HourTimeFromMoment(time) {
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

export function to12HourTime(time) {
  if (time) {
    const [hour, minute] = time
    if (isInteger(hour) && isInteger(minute)) {
      if (hour >= 12) {
        return {
          hour: hour === 12 ? 12 : hour - 12,
          minute,
          mode: 'PM'
        }
      } else {
        return {
          hour: hour === 0 ? 12 : hour,
          minute,
          mode: 'AM'
        }
      }
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}



export function toMilitaryTime(time) {
  if (time) {
    const {hour, minute, mode} = time
    if (isInteger(hour) && isInteger(minute) && mode) {
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
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}

export function getDatetime(date, time) {
  if (date) {
    if (time) {
      const [hour, minute] = toMilitaryTime(time)
      return date.clone().hour(hour).minute(minute)
    } else {
      return date.clone().startOf('day')
    }

  } else {
    return moment().startOf('day')
  }
}
