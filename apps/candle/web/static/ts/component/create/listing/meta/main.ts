import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'

function intent(sources) {
  const {Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    .publishReplay(1).refCount()
  
  return {
    session$
  }
}

function isValid(session) {
  return false
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1)
    })
    .switchMap((info: any) => {
      const session = info.session
      const init = {
        session,
        valid: session ? isValid(session) : false
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
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

      return div(`.meta`, [
        'Hello'
      ])
    })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    output$: state$
  }
}
