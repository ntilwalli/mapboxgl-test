import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable from 'immutable'

import {combineObj} from '../utils'

function intent(sources) {
  const click$ = sources.DOM.select(`.appCustomRadioInput`).events(`click`)
    .map(ev => ev.ownerTarget.dataset.value)

  return {
    click$
  }
}

function reducers(actions, inputs) {
  const clickR = actions.click$
    .map(sel => state => {
      return state.set(`selected`, sel)
    })

  return O.merge(
    clickR
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return ((inputs && inputs.props$) || O.of(undefined))
    .switchMap(props => {
      return reducer$
        .startWith(props ? Immutable.Map(props) : Immutable.Map({
          selected: undefined
        }))
        .scan((acc, reducer) => reducer(acc))
    })
    .map(x => x.toJS())
    .publishReplay(1).refCount()

}

function view(state$, {styleClass, options}) {
  return state$.map(state => {
    return div(`.custom-radios-container`, options.map(({displayValue, value}) => {

      return span(`.custom-radio-input`, [
        span(`.appCustomRadioInput${styleClass || '.circle'}${state.selected === value ? '.checked' : ''}`, {
          attrs: {
            'data-value': value
          }
        }),
        span(`.appCustomRadioInput.custom-radio-input-label`, {
          attrs: {
            'data-value': value
          }
        }, [displayValue])
      ])
    }))
  })
}


function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, inputs)

  return {
    DOM: vtree$,
    selected$: state$
      .map(state => state.selected)
      .map(x => {
        return x
      })
      .publishReplay(1).refCount()
  }
}

export default (sources, props) => isolate(main)(sources, props)
