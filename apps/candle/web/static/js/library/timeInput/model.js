import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import moment from 'moment'
import {between, notBetween, combineObj, spread} from '../../utils'
import {getMomentFromStateInfo, getDateFromStateInfo, standardize, AM, PM} from './utils'



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
  const clearR = (inputs.clear$ || O.never()).map(x => state => {
    return state.set(`currentTime`, getDefaultCurrentTime()).set(`currentDate`, undefined)
  })

  const timeR = (actions.date$ || O.never()).map(val => state => {
    //console.log(`Date reducer`, val)
    const locked = state.get(`locked`)
    if (!locked) {
      now = standardize(moment(val.toISOString()))

      const out = hours24to12(now.hours())
      let currentTime = {
        hour: out.hour,
        minute: now.minute(),
        mode: out.pm ? PM : AM
      }

      return state.set(`currentTime`, currentTime)
    } else {
      return state
    }
  })

  const rangeStartR = inputs.rangeStart$.map(val => state => {
    //console.log(`Changing rangeStart`, val)
    if (val) {
      const currentTime = standardize(getMomentFromStateInfo(state.get(`currentTime`)))
      const mVal = standardize(moment(val.toISOString()))
      if (currentTime < mVal) {
        throw new Error('Attempted to change start range to outside current time.')
      }

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

  const rangeEndR = inputs.rangeEnd$.map(val => state => {
    //console.log(`Changing rangeEnd`, val)
    if (val) {
      const currentTime = standardize(getMomentFromStateInfo(state.get(`currentTime`)))
      const mVal = standardize(moment(val.toISOString()))
      if (currentTime > mVal) {
        throw new Error('Attempted to change end range to outside current time.')
      }

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

  const changeHourR = actions.changeHour$.map(val => currState => {
    const state = currState.set(`locked`, true)
    let currentTime = state.get(`currentTime`)
    const {hour, minute, mode} = currentTime
    if (hour === 11 && val === 1)
      return state.set(`currentTime`, spread(currentTime, {hour: 12, mode: getReverseMode(mode)}))
    else if (hour === 12 && val === -1)
      return state.set(`currentTime`, spread(currentTime, {hour: 11, mode: getReverseMode(mode)}))
    else
      return state.set(`currentTime`, spread(currentTime, {hour: hour === 12 && val === 1 ? 1 : hour === 1 && val === -1 ? 12 : hour + val }))
  })

  const changeMinuteR = actions.changeMinute$.map(val => currState => {
    const state = currState.set(`locked`, true)
    let currentTime = state.get(`currentTime`)

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

  })

  const changeMeridiemR= actions.changeMeridiem$.map(val => currState => {
    const state = currState.set(`locked`, true)

    let currentTime = state.get(`currentTime`)

      const {hour, minute, mode} = currentTime
      return state.set(`currentTime`, spread(currentTime, {mode: getReverseMode(mode)}))

  })


  return O.merge(
    clearR,
    timeR,
    rangeStartR,
    rangeEndR,
    changeHourR,
    changeMinuteR,
    changeMeridiemR
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
      let currentTime, current

      let rangeStart = props.rangeStart ? standardize(moment(props.rangeStart.toISOString())) : undefined
      let rangeEnd = props.rangeEnd ? standardized(moment(props.rangeEnd.toISOString())) : undefined

      if (initialState) {
        if (rangeStart && rangeStart > initialState) {
          throw new Error(`Invalid range start relative to initialState`)
        }

        if (rangeEnd && rangeEnd < initialState) {
          throw new Error(`Invalid range end relative to initialState`)
        }

        locked = true
        current = moment(initialState.toISOString())
        currentTime = getCurrentTime(current)

      } else if (props.defaultNow) {

        if (rangeStart && rangeStart > now) {
          throw new Error(`Invalid range start relative to now`)
        }

        if (rangeEnd && rangeEnd < now) {
          throw new Error(`Invalid range end relative to now`)
        }

        current = moment((new Date()).toISOString())
        currentTime = getCurrentTime(current)
      } else {
        if (rangeStart) {
          currentTime = getCurrentTime(rangeStart)
        } else if (rangeEnd) {
          currentTime = getCurrentTime(rangeEnd)
        } else {
          currentTime = getDefaultCurrentTime()
        }
      }

      const init = {
        locked,
        currentTime,
        rangeStart, 
        rangeEnd,
        defaultRangeStart: rangeStart,
        defaultRangeEnd: rangeEnd
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`state of dateInput`, x))
    .publishReplay(1).refCount()

}
