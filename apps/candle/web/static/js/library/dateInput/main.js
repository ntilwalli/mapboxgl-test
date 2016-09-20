import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import moment from 'moment'

import intent from './intent'
import model from './model'
import view from './view'

import TextInput from '../textInput'

import {combineObj, spread} from '../../utils'
import {getCurrentDate} from './utils'

// const hourInputProps = O.of({
//   placeholder: `hh`,
//   name: `hour`,
//   required: true,
//   key: `hour`
// })

// const minuteInputProps = O.of({
//   placeholder: `mm`,
//   name: `minute`,
//   required: true,
//   key: `minute`
// })

function main(sources, inputs) {

  const initialCurrent$ = (inputs.initialState$ || O.of({}))
    .map(({current}) => current ? moment(current.toISOString()) : undefined)
    //.debug(`initialCurrent`)
    //.filter(x => x)
    .publishReplay(1).refCount()

  const initialHour$ = initialCurrent$
    .map(x => ({hour: x ? x.hour() : ``}))
    .do(x => console.log(`initialHour`, x))

  const initialMinute$ = initialCurrent$
    .map(x => ({minute: x ? x.minute() : ``}))
    .do(x => console.log(`initialMinute`, x))

  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    Global: actions.keepFocusOnInput$
      .map(ev => ({type: `preventDefault`, data: ev})),
    result$: state$.filter(state => {
      const {currentDate, currentTime} = state
      return currentDate && currentTime
    })
    .map(state => {
      const {currentDate, currentTime} = state
      return getCurrentDate(currentDate, currentTime)
    })
    .publishReplay(1).refCount()
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)