import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'

import intent from './intent'
import model from './model'
import view from './view'

import TextInput from '../textInput'

import {noopListener, combineObj} from '../../utils'

const hourInputProps = O.of({
  placeholder: `hh`,
  name: `hour`,
  required: true,
  key: `hour`
})

const minuteInputProps = O.of({
  placeholder: `mm`,
  name: `minute`,
  required: true,
  key: `minute`
})

export default function main(sources, inputs) {

  const initialCurrent$ = (inputs.initialState$ || xs.of({}))
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
  }
}
