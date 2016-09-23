import {Observable as O} from 'rxjs'
import {div, input, select, option, h5, li, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable from 'immutable'
import {combineObj, createProxy, spread} from '../../../../utils'
import DateInput from '../../../../library/dateInput/main'

import {getMomentFromCurrentDate, getDateFromCurrentDate} from '../../helpers'

function intent(sources, inputs) {
  const clear$ = sources.DOM.select(`.appClear`).events(`click`) 
  return {
    clear$
  }
}

function reducers(actions, inputs) {
  const clearR = actions.clear$.map(x => state => {
    return state.set(`currentDate`, undefined)
  })

  const currentDateR = inputs.currentDate$
    .map(d => state => {
      return state.set(`currentDate`, d)
    })

  return O.merge(
    currentDateR,
    clearR 
  )
}

function model(actions, inputs) {
  const {initialState$} = inputs
  return initialState$
    .take(1)
    .switchMap(val => {
      const initialState = {
        currentDate: val
      }

      return reducers(actions, inputs)
        .startWith(Immutable.Map(initialState))
        .scan((state, reducer) => reducer(state))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`chooseDate state...`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}

function renderStartDateModalBody(info) {
  const {state, components} = info
  const {currentDate} = state
  return  div(`.choose-date-modal`, [
    span(`.date-display`,  [
      !currentDate ? span(`.no-date-selected`, [`Not selected`]) :
                     span(`.date-display`, [
                       getMomentFromCurrentDate(state.currentDate)
                         .format("dddd, MMMM Do YYYY")
                     ]),
      !currentDate ? null : span(`.appClear.clear-button`, [`×`])
    ]),
    components.dateInput
  ])
}

function view({state$, components}) {
  return combineObj({state$, components$: combineObj(components)}).map(info => {
    return renderStartDateModalBody(info)
  })
}

function main(sources, inputs) {

  const {initialState$} = inputs
  const actions = intent(sources, inputs)

  const dateInput = DateInput(sources, {
    props$: O.of({
      defaultNow: false
    }),
    initialState$: initialState$
      .map(x => x ? getDateFromCurrentDate(x) : x),
    rangeStart$: O.never(),
    rangeEnd$: O.never()
  })

  const state$ = model(actions, spread(inputs, {
    currentDate$: dateInput.result$
  }))

  const out = {
    DOM: view({state$, components: {dateInput$: dateInput.DOM}}),
    output$: state$.map(x => x.currentDate)
  }

  return out
}

export default (sources, inputs) => isolate(main)(sources, inputs)