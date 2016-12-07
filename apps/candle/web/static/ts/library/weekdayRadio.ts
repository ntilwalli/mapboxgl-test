import {Observable as O} from 'rxjs'
import {div, svg} from '@cycle/dom'
import Immutable = require('immutable')
import moment = require('moment')
import {combineObj, traceStartStop} from '../utils'

const {g, rect, text} = svg

function intent(sources) {
  const {DOM} = sources

  return {
    click$: DOM.select(`.appDay`).events(`click`).map(ev => ev.target.getAttribute(`data-day`))
  }
}

function reducers(actions, inputs) {
  const click_r = actions.click$.map(val => state => {
    const {day} = state
    if (day === val) {
      state.day = undefined
    } else {
      state.day = val
    }

    return state
  })

  return O.merge(click_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      day: inputs.props$
    })
    .switchMap((info: any) => {

      //console.log(`init`, init)
      return reducer$
        .startWith(info)
        .scan((acc, f: Function) => f(acc))
    })
    // .do(x => console.log(`weekday selector state`, x))
    // .letBind(traceStartStop(`weekday selector state trace`))
    .publishReplay(1).refCount()
}


const weekdays = [
  `Sunday`,
  `Monday`,
  `Tuesday`,
  `Wednesday`,
  `Thursday`,
  `Friday`,
  `Saturday`
]

function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {day} = state

      const out = div('.byweekday-selector', weekdays.map(val => {
        return div('.appDay.day', {
          attrs: {'data-day': val.toLowerCase()},
          class: {
            selected: day === val.toLowerCase()
          }
        }, [val.substring(0, 2)])
      }))

      return out
    }) 
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    output$: state$.pluck('day')
  }
}