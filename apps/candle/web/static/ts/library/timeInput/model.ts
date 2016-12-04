import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import moment = require('moment')
import {between, notBetween, combineObj, spread} from '../../utils'
import {standardize, AM, PM} from './utils'

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

function reducers(actions, inputs) {
  const clear_r = actions.clear$.map(_ => state => {
    return state.set(`currentTime`, undefined)
  })

  const changeHourR = actions.changeHour$.map(val => state => {

    let currentTime = state.get(`currentTime`)
    let rangeEnd = state.get(`rangeEnd`)
    let rangeStart = state.get(`rangeStart`)

    if (currentTime) {
      const {hour, minute, mode} = currentTime
      if (hour === 11 && val === 1)
        return state.set(`currentTime`, {...currentTime, hour: 12})
      else if (hour === 12 && val === -1)
        return state.set(`currentTime`, {...currentTime, hour: 11})
      else
        return state.set(`currentTime`, {...currentTime, hour: hour === 12 && val === 1 ? 1 : hour === 1 && val === -1 ? 12 : hour + val })
    } else {
      return state.set(`currentTime`, getDefaultCurrentTime())
    }

})

  const changeMinuteR = actions.changeMinute$.map(val => state => {
    let currentTime = state.get(`currentTime`)

    if (currentTime) {
      const {hour, minute, mode} = currentTime
      if (minute === 59 && val === 1)
        return state.set(`currentTime`, {minute: 0, hour, mode})
      else if (minute === 0 && val === -1)
        return state.set(`currentTime`, {minute: 59, hour, mode})
      else
        return state.set(`currentTime`, {...currentTime, minute: minute + val})
    } else {
      return state.set(`currentTime`, getDefaultCurrentTime())
    }


  })

  const changeMeridiemR= actions.changeMeridiem$.map(val => state => {

    let currentTime = state.get(`currentTime`)

    if (currentTime) {
      const {hour, minute, mode} = currentTime
      return state.set(`currentTime`, {...currentTime, mode: getReverseMode(mode)})
    } else {
      return state.set(`currentTime`, getDefaultCurrentTime())
    }
  })

  return O.merge(
    changeHourR,
    changeMinuteR,
    changeMeridiemR,
    clear_r,

  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      props$: inputs.props$.take(1)
    })
    .switchMap(({props}: any) => {
      //console.log(`initialState`, initialState)
      const init = {
        currentTime: props
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map(x => (<any> x).toJS())
    //.do(x => console.log(`state of dateInput`, x))
    .publishReplay(1).refCount()

}
