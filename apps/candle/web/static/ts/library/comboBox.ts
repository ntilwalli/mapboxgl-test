import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../utils'

function intent(sources) {
  const {DOM} = sources

  return {

  }
}

function reducers(actions, inputs) {
  return O.merge(O.never())
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      authorization: inputs.Authorization.status$.take(1)
    })
    .switchMap((info: any) => {
      const {authorization} = info
      const init = {
        authorization,
        value: undefined
      }
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      return div([`Hello`])
    })
}

function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const components = {}
  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.pluck(`value`)
  }
}

export {
  main
}

