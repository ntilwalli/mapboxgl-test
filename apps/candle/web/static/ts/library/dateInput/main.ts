import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import moment = require('moment')

import intent from './intent'
import model from './model'
import view from './view'

import TextInput from '../textInput'

import {combineObj, spread} from '../../utils'
import {getDateFromStateInfo} from './utils'

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

  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    //Global: O.never(),
    result$: state$
      .map(state => {
        const {currentDate} = state
        return currentDate
      })
      .distinctUntilChanged(null, x => x)
      //.do(x => console.log(`dateInput changed`, x))
      .publishReplay(1).refCount()
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)