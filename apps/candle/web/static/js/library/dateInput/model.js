import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import moment from 'moment'
import {between, notBetween, combineObj, spread} from '../../utils'
import {getMomentFromStateInfo, getDateFromStateInfo} from './utils'

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

  const dateReducer$ = (actions.date$ || O.never()).map(val => state => {
    //console.log(`Date reducer`, val)
    const locked = state.get(`locked`)
    if (!locked) {
      now = moment(val.toISOString())
      const currentDate = getCurrentDate(now)
      return state.set(`currentDate`, currentDate)
    } else {
      return state
    }
  })

  const rangeStartR = inputs.rangeStart$.map(val => state => {
    //console.log(`Changing rangeStart`, val)
    if (val) {
      const mVal = moment(val.toISOString()).startOf('day')
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
      const mVal = moment(val.toISOString()).startOf('day')
      const defaultRangeEnd = state.get(`defaultRangeEnd`)
      if (defaultRangeEnd) {
        const rangeEnd = (mVal <= defaultRangeEnd) ? mVal : defaultRangeEnd
        return state.set(`rangeEnd`, rangeEnd)
      } else {
        return state.set(`rangeEnd`, mVal)
      }
    }
    return state
  })

  const itemClickR = actions.itemClick$.map(d => currState => {
    const state = currState.set(`locked`, true)
    const rangeStart = currState.get(`rangeStart`)
    const rangeEnd = currState.get(`rangeEnd`)

    const date = moment((new Date(d)).toISOString())
    const newCurrentDate = getCurrentDate(date)

    if (rangeStart && date.isBefore(rangeStart)) {
      throw new Error("Given date is out of range (rangeStart)")
    }

    if (rangeStart && date.isBefore(rangeEnd)) {
      throw new Error("Given date is out of range (rangeEnd)")
    }

    return state.set(`currentDate`, newCurrentDate)
  })

  const changeMonthR = actions.changeMonth$.map(val => state => {
    const year = state.get(`year`)
    const month = state.get(`month`)
    const date = state.get(`date`)
    const curr = moment((new Date(year, month + val, date)).toISOString())
    return state.set(`year`, curr.year()).set(`month`, curr.month()).set(`date`, date)
  })

  return O.merge(
    clearR,
    dateR,
    rangeStartR,
    rangeEndR,
    itemClickR,
    changeMonthR,
  )
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

      let rangeStart = props.rangeStart ? moment(props.rangeStart.toISOString()).startOf('day') : undefined
      let rangeEnd = props.rangeEnd ? moment(props.rangeEnd.toISOString()).startOf('day') : undefined

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
      } else {
        currentDate = undefined
      }

      let displayStart
      if (currentDate && currentTime) {
        displayStart = getMomentFromStateInfo(currentDate)
      } else if (rangeStart) {
        displayStart = rangeStart
      } else {
        displayStart = now
      }

      const init = {
        locked,
        dateFormat: `MMDDYYYY`,
        month: displayStart.month(),
        date: displayStart.date(),
        year: displayStart.year(),
        currentDate,
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
