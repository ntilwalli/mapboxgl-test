import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import moment from 'moment'
import {between, notBetween, combineObj, spread} from '../../utils'
import {getMomentFromStateInfo, getDateFromStateInfo, AM, PM} from './utils'



const getReverseMode = (mode) => mode === AM ? PM : AM

function hours24to12(h) {
    return {
        hour : (h + 11) % 12 + 1,
        pm : h >= 12
    }
}

function getCurrentTime(d) {
  const out = hours24to12(d.hours())
  return {
    hour: out.hour,
    minute: d.minute(),
    mode: out.pm ? PM : AM
  }
}

function getDefaultCurrentTime() {
  return {
    hour: 12,
    minute: 0,
    mode: PM
  }
}

function getCurrentDate(d) {
  return {
    year: d.year(),
    month: d.month(),
    date: d.date()
  }
}

function reducers(actions, inputs) {
  const displayPickerR = O.merge(
    actions.displayPicker$,
    (inputs.close$ || O.never()).mapTo(false) 
  ).map(val => state => {
        //console.log(`Display picker reducer`, val)
    return state.set(`displayPicker`, val)
  })

  const clearR = actions.clear$.map(x => state => {
    return state.set(`currentTime`, getDefaultCurrentTime()).set(`currentDate`, undefined)
  })

  const dateTimeR = (actions.date$ || O.never()).map(val => state => {
    //console.log(`Date reducer`, val)
    const locked = state.get(`locked`)
    if (!locked) {
      now = moment(val.toISOString())

      const currentDate = {
        year: now.year(),
        month: now.month(),
        date: now.date()
      }

      const out = hours24to12(now.hours())
      let currentTime = {
        hour: out.hour,
        minute: now.minute(),
        mode: out.pm ? PM : AM
      }

      return state.set(`currentDate`, currentDate).set(`currentTime`, currentTime)
    } else {
      return state
    }
  })

  const rangeStartReducer$ = inputs.rangeStart$.map(val => state => {
    //console.log(`Changing rangeStart`, val)
    if (val) {
      const mVal = moment(val.toISOString())
      const defaultRangeStart = state.get(`defaultRangeStart`)
      if (defaultRangeStart) {
        const rangeStart = (mVal >= defaultRangeStart) ? mVal : defaultRangeStart
        return state.set(`rangeStart`, rangeStart)
      } else {
        return state.set(`rangeStart`, mVal)
      }
    }

    return state
  })

  const rangeEndReducer$ = inputs.rangeEnd$.map(val => state => {
    //console.log(`Changing rangeEnd`, val)
    if (val) {
      const mVal = moment(val.toISOString())
      const defaultRangeEnd = state.get(`defaultRangeEnd`)
      if (defaultRangeEnd) {
        const rangeEnd = (mVal < defaultRangeEnd) ? mVal : defaultRangeEnd
        return state.set(`rangeEnd`, rangeEnd)
      } else {
        return state.set(`rangeEnd`, mVal)
      }
    }
    return state
  })

  const itemClickReducer$ = actions.itemClick$.map(d => currState => {
    const state = currState.set(`locked`, true)
    const rangeStart = currState.get(`rangeStart`)
    const rangeEnd = currState.get(`rangeEnd`)
    const currentTime = currState.get(`currentTime`)

    const date = moment((new Date(d)).toISOString())
    const newCurrentDate = getCurrentDate(date)
    const fullDate = getMomentFromStateInfo(newCurrentDate, currentTime)
    if (rangeStart && fullDate.isBefore(rangeStart)) {
      const newCurrentTime = getCurrentTime(rangeStart)
      return state.set(`currentDate`, newCurrentDate).set(`currentTime`, newCurrentTime)
    }

    if (rangeEnd && fullDate.isAfter(rangeEnd)) {
      const newCurrentTime = getCurrentTime(rangeEnd)
      return state.set(`currentDate`, newCurrentDate).set(`currentTime`, newCurrentTime)
    }

    return state.set(`currentDate`, newCurrentDate)
  })

  const changeMonthReducer$ = actions.changeMonth$.map(val => state => {
    const year = state.get(`year`)
    const month = state.get(`month`)
    const date = state.get(`date`)
    const curr = moment((new Date(year, month + val, date)).toISOString())
    return state.set(`year`, curr.year()).set(`month`, curr.month()).set(`date`, date)
  })

  const changeHourReducer$ = actions.changeHour$.map(val => currState => {
    const state = currState.set(`locked`, true)

    const currentDate = state.get(`currentDate`)
    let currentTime = state.get(`currentTime`)
    if (currentDate) {
      const current = getMomentFromStateInfo(currentDate, currentTime).add(val, 'hour')
      return state.set(`currentDate`, getCurrentDate(current)).set(`currentTime`, getCurrentTime(current))
    } else {
      const {hour, minute, mode} = currentTime
      if (hour === 11 && val === 1)
        return state.set(`currentTime`, spread(currentTime, {hour: 12, mode: getReverseMode(mode)}))
      else if (hour === 12 && val === -1)
        return state.set(`currentTime`, spread(currentTime, {hour: 11, mode: getReverseMode(mode)}))
      else
        return state.set(`currentTime`, spread(currentTime, {hour: hour === 12 && val === 1 ? 1 : hour === 1 && val === -1 ? 12 : hour + val }))
    }
  })

  const changeMinuteReducer$ = actions.changeMinute$.map(val => currState => {
    const state = currState.set(`locked`, true)
    const currentDate = state.get(`currentDate`)
    let currentTime = state.get(`currentTime`)
    if (currentDate) {
      const current = getMomentFromStateInfo(currentDate, currentTime).add(val, 'minute')
      return state.set(`currentDate`, getCurrentDate(current)).set(`currentTime`, getCurrentTime(current))
    } else {
      const {hour, minute, mode} = currentTime
      if (minute === 59 && hour === 11 && val === 1)
        return state.set(`currentTime`, {minute: 0, hour: 12, mode: getReverseMode(mode)})
      else if (minute === 0 && hour === 12 && val === -1)
        return state.set(`currentTime`, {minute: 59, hour: 11, mode: getReverseMode(mode)})
      else if (minute === 59 && val === 1)
          return state.set(`currentTime`, spread(currentTime, {minute: 0, hour: hour+1}))
      else if (minute === 0 && val === -1)
          return state.set(`currentTime`, spread(currentTime, {minute: 59, hour: hour-1}))
      else
        return state.set(`currentTime`, spread(currentTime, {minute: minute + val}))
    }
  })

  const changeMeridiemReducer$ = actions.changeMeridiem$.map(val => currState => {
    const state = currState.set(`locked`, true)

    const currentDate = state.get(`currentDate`)
    let currentTime = state.get(`currentTime`)
    if (currentDate) {
      const current = getMomentFromStateInfo(currentDate, currentTime).add(val, 'hour')
      return state.set(`currentDate`, getCurrentDate(current)).set(`currentTime`, getCurrentTime(current))
    } else {
      const {hour, minute, mode} = currentTime
      return state.set(`currentTime`, spread(currentTime, {mode: getReverseMode(mode)}))
    }
  })


  return O.merge(
    //displayPickerReducer$,
    clearR,
    dateTimeR,
    rangeStartReducer$,
    rangeEndReducer$,
    itemClickReducer$,
    changeMonthReducer$,
    changeHourReducer$,
    changeMinuteReducer$,
    changeMeridiemReducer$
  )
}

function hours24to12(h) {
    return {
        hour : (h + 11) % 12 + 1,
        pm : h >= 12
    }
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const initialState$ = inputs.initialState$ || O.of(undefined)
  const props$ = inputs.props$ || O.of({defaultNow: false})

  return combineObj({
    initialState$: initialState$,
      //.do(x => console.log(`A`)), 
    props$: props$
      //.do(x => console.log(`B`)),
  })
    .switchMap(({initialState, props}) => {

      let now = moment((new Date()).toISOString())
      let locked = false
      let currentDate, currentTime, current

      let rangeStart = props.rangeStart ? moment(props.rangeStart.toISOString()) : undefined
      let rangeEnd = props.rangeEnd ? moment(props.rangeEnd.toISOString()) : undefined

      if (initialState) {
        if (rangeStart && rangeStart > initialState) {
          throw new Error(`Invalid range start relative to initialState`)
        }

        if (rangeEnd && rangeEnd < initialState) {
          throw new Error(`Invalid range end relative to initialState`)
        }

        locked = true
        current = moment(initialState.toISOString())
        currentDate = getCurrentDate(current)
        currentTime = getCurrentTime(current)

      } else if (props.defaultNow) {

        if (rangeStart && rangeStart > now) {
          throw new Error(`Invalid range start relative to now`)
        }

        if (rangeEnd && rangeEnd < now) {
          throw new Error(`Invalid range end relative to now`)
        }

        current = moment((new Date()).toISOString()).add(1, 'hour').startOf('hour')
        currentDate = getCurrentDate(current)
        currentTime = getCurrentTime(current)
      } else {
        currentDate = undefined
        currentTime = getDefaultCurrentTime()
      }

      let displayStart
      if (currentDate && currentTime) {
        displayStart = getMomentFromStateInfo(currentDate, currentTime)
      } else if (rangeStart) {
        displayStart = rangeStart
      } else {
        displayStart = now
      }

      const init = {
        locked,
        displayPicker: true,
        dateFormat: `MMDDYYYY`,
        month: displayStart.month(),
        date: displayStart.date(),
        year: displayStart.year(),
        currentDate,
        currentTime,
        rangeStart, 
        rangeEnd,
        defaultRangeStart: rangeStart,
        defaultRangeEnd: rangeEnd,
        placeholder: props.placeholder || `Enter date here`
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`state of dateInput`, x))
    .publishReplay(1).refCount()

}
