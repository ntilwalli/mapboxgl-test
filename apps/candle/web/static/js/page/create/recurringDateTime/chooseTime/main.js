import {Observable as O} from 'rxjs'
import {div, input, select, option, h5, li, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable from 'immutable'
import {combineObj, createProxy, spread} from '../../../../utils'
import TimeInput from '../../../../library/timeInput/main'

import {getMomentFromCurrentTime, getTimeFromCurrentTime} from '../../helpers'

function intent(sources, inputs) {
  const clear$ = sources.DOM.select(`.appClear`).events(`click`) 
  return {
    clear$
  }
}

function reducers(actions, inputs) {
  const clearR = actions.clear$.map(x => state => {
    return state.set(`currentTime`, undefined)
  })

  const currentTimeR = inputs.currentTime$
    .map(d => state => {
      return state.set(`currentTime`, d)
    })

  return O.merge(
    currentTimeR,
    clearR 
  )
}

function model(actions, inputs) {
  const {initialState$} = inputs
  return initialState$
    .take(1)
    .switchMap(val => {
      const initialState = {
        currentTime: val
      }

      return reducers(actions, inputs)
        .startWith(Immutable.Map(initialState))
        .scan((state, reducer) => reducer(state))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`chooseTime state...`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}

function renderModalBody(info) {
  const {state, components} = info
  const {currentTime} = state
  return  div(`.choose-time-modal`, [
    components.timeInput,
    currentTime ? span(`.time-display`,  [
    //   !currentTime ? span(`.no-date-selected`, [`Not selected`]) :
    //                  span(`.date-display`, [
    //                    getMomentFromCurrentTime(state.currentTime)
    //                      .format("h:mm a")
    //                  ]),
      span(`.appClear.clear-button`, [`clear`])
    ]) : null
  ])
}

function view({state$, components}) {
  return combineObj({state$, components$: combineObj(components)}).map(info => {
    return renderModalBody(info)
  })
}

function main(sources, inputs) {

  const {initialState$} = inputs
  const actions = intent(sources, inputs)

  const timeInput = TimeInput(sources, {
    props$: O.of({
      defaultNow: false
    }),
    initialState$: initialState$
      .map(x => x ? getTimeFromCurrentTime(x) : x),
    clear$: actions.clear$,
    rangeStart$: O.never(),
    rangeEnd$: O.never()
  })

  const state$ = model(actions, spread(inputs, {
    currentTime$: timeInput.result$
  }))

  const out = {
    DOM: view({state$, components: {timeInput$: timeInput.DOM}}),
    output$: state$.map(x => x.currentTime)
  }

  return out
}

export default (sources, inputs) => isolate(main)(sources, inputs)