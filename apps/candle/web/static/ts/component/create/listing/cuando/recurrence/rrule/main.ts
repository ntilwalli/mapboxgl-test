import {Observable as O} from 'rxjs'
import {div, form, span, input} from '@cycle/dom'
import Immutable = require('immutable')
import moment = require('moment')
//import {RRule, rrulestr, RRuleSet} from 'rrule'
import {combineObj, createProxy, blankComponentUndefinedDOM} from '../../../../../../utils'

import Advanced from './advanced/main'
import Weekly from './weekly/main'
import Monthly from './monthly/main'
import TimeInput from '../../../../../../library/timeInput/main'
import WeekdaySelector from '../../../../../../library/weekdaySelector'

function intent(sources) {
  const {DOM, Router} = sources
  const frequency$ = DOM.select(`.appWeeklyRadio`).events(`click`).map(ev => ev.target.value)
  return {
    session$: Router.history$
      .map(x => x.state.data)
      .publishReplay(1).refCount(),
    frequency$
  }
}

function reducers(actions, inputs) {
  const frequency_r = actions.frequency$.map(val => state => {
    return state.update(`recurrence`, recurrence => {
      recurrence.rrule.freq = val
      return recurrence
    })
  })

  const change_r = inputs.change$.map(val => state => {
    const type = state.get(`type`)
    return state.update(`rrule`, recurrence => {
      if (type === `weekly`) {
        throw new Error(`Invalid frequency weekly`)
      } else if (type === `monthly`) {
        throw new Error(`Invalid frequency monthly`)
      } else if (type === `advanced`) {
        return val;
      }
    })
  })

  return O.merge(change_r, frequency_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$
    .switchMap(rrule => {
      //console.log(`rrule main init`, rrule)
      const init = {
        type: `advanced`,
        rrule: rrule || {
          freq: `weekly`,
          byweekday: [],
          interval: undefined,
          bysetpos: [],
          dtstart: undefined,
          until: undefined
        }
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`rrule state`, x))
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    })
    .map((info: any) => {
      const {state, components} = info
      const {input_component} = components
      return div(`.rrule-component`, [
        input_component
      ])
    })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const change$ = createProxy();
  const state$ = model(actions, {...inputs, change$})

  const input_component$ = state$
    .distinctUntilChanged(
      (x: any, y: any) => JSON.stringify(x.rrule) === JSON.stringify(y.rrule)
    )
    .map(state => {
      const {type, rrule} = state
      const {freq, byweekday} = rrule
      if (type === `weekly`) {
        return WeekdaySelector(sources, {...inputs, props$: O.of(byweekday).publishReplay(1).refCount()})
      } else if (type === `monthly`) {
        return Monthly(sources, {...inputs, props$: O.of(rrule).publishReplay(1).refCount()})
      } else if (type === `advanced`) {
        return Advanced(sources, {...inputs, props$: O.of(rrule).publishReplay(1).refCount()})
      } else {
        return {
          DOM: O.of(undefined),
          output$: O.never()
        }
      }
        //return Advanced(sources, {...inputs, props$: O.of(state.data)})
      // } else {
      //   return {
      //     DOM: O.of(undefined),
      //     output$: O.never()
      //   }
      // }

    })
    .publishReplay(1).refCount()

  change$.attach(input_component$.switchMap(x => x.output$))

  const components = {
    input_component$: input_component$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, components)
  return {
    DOM: vtree$,
    output$: state$.pluck(`rrule`)
  }
}