import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import moment from 'moment'
import {between, notBetween, combineObj, spread} from '../../utils'

const AM = `A.M.`
const PM = `P.M.`

const getReverseMode = (mode) => mode === AM ? PM : AM

function reducers(actions, inputs) {
  const displayPickerReducer$ = actions.displayPicker$.map(val => state => {
    return state.set(`displayPicker`, val)
  })

  const rangeStartReducer$ = inputs.rangeStart$.map(val => state => {
    const defaultRangeStart = state.get(`defaultRangeStart`)
    if (defaultRangeStart) {
      const rangeStart = (val && val < defaultRangeStart) ? val : defaultRangeStart
      return state.set(`rangeStart`, rangeStart)
    } else {
      return state.set(`rangeStart`, val)
    }
  })

  const rangeEndReducer$ = inputs.rangeEnd$.map(val => state => {
    const defaultRangeEnd = state.get(`defaultRangeEnd`)
    if (defaultRangeEnd) {
      const rangeEnd = (val && val < defaultRangeEnd) ? val : defaultRangeEnd
      return state.set(`rangeEnd`, rangeEnd)
    } else {
      return state.set(`rangeEnd`, val)
    }
  })

  const itemClickReducer$ = actions.itemClick$.map(d => state => {
    const date = moment((new Date(d)).toISOString())
    const newCurrent = {
      year: date.year(),
      month: date.month(),
      date: date.date()
    }

    return state.set(`currentDate`, newCurrent)
  })

  const changeMonthReducer$ = actions.changeMonth$.map(val => state => {
    const year = state.get(`year`)
    const month = state.get(`month`)
    const date = state.get(`date`)
    const curr = moment((new Date(year, month + val, date)).toISOString())
    return state.set(`year`, curr.year()).set(`month`, curr.month()).set(`date`, date)
  })

  const changeHourReducer$ = actions.changeHour$.map(val => state => {
    const currentTime = state.get(`currentTime`)
    const {hour, minute, mode} = currentTime
    if (hour === 11 && val === 1)
      return state.set(`currentTime`, spread(currentTime, {hour: 12, mode: getReverseMode(mode)}))
    else if (hour === 12 && val === -1)
      return state.set(`currentTime`, spread(currentTime, {hour: 11, mode: getReverseMode(mode)}))
    else
      return state.set(`currentTime`, spread(currentTime, {hour: hour === 12 && val === 1 ? 1 : hour === 1 && val === -1 ? 12 : hour + val }))
  })

  const changeMinuteReducer$ = actions.changeMinute$.map(val => state => {
    const currentTime = state.get(`currentTime`)
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

  const changeModeReducer$ = actions.changeMode$.map(val => state => {
    const currentTime = state.get(`currentTime`)
    const {hour, minute, mode} = currentTime
    return state.set(`currentTime`, spread(currentTime, {mode: getReverseMode(mode)}))
  })


  return O.merge(
    displayPickerReducer$,
    rangeStartReducer$,
    rangeEndReducer$,
    itemClickReducer$,
    changeMonthReducer$,
    changeHourReducer$,
    changeMinuteReducer$,
    changeModeReducer$
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
  const initialState$ = inputs.initialState$ || O.of({})
  const props$ = inputs.props$ || O.of({defaultNow: true})

  return combineObj({init$: initialState$, props$})
    .switchMap(({init, props}) => {
      const now = moment((new Date()).toISOString()).add(1, 'hour').startOf('hour')
      const currentDate = init.currentDate || props.defaultNow ? {
        year: now.year(),
        month: now.month(),
        date: now.date()
      } : undefined


      const out = hours24to12(now.hours())
      let currentTime = init.currentTime || props.defaultNow ? {
        hour: out.hour,
        minute: now.minute(),
        mode: out.pm ? PM : AM
      } : {hour: 12, minute: 0, mode: PM}


      const temp = moment((currentDate && new Date(currentDate.year, currentDate.month, currentDate.date) || new Date()).toISOString())
      const initialState = {
        displayPicker: false,
        dateFormat: `MMDDYYYY`,
        month: temp.month(),
        date: temp.date(),
        year: temp.year(),
        currentDate,
        currentTime,
        rangeStart: init.rangeStart || undefined,
        rangeEnd: init.rangeEnd || undefined,
        defaultRangeStart: init.rangeStart || undefined,
        defaultRangeEnd: init.rangeEnd || undefined,
        placeholder: init.placeholder || `Enter date here`
      }

      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`from dateInput`, x))
    .publishReplay(1).refCount()

}
