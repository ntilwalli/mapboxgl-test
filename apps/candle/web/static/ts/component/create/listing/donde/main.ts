import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, mergeSinks} from '../../../../utils'
import {renderMenuButton, renderCircleSpinner, renderLoginButton, renderSearchCalendarButton} from '../../../renderHelpers/navigator'

function intent(sources) {
  const {Router} = sources
  return {
    session$: Router.history$.pluck(`state`)
  }
}

function reducers(actions, inputs) {
  return O.merge(O.never())
}

function model(actions, inputs) {
  const init = {}
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1),
      authorization$: inputs.Authorization.status$.take(1)
    })
    .switchMap((info: any) => {
      const {session, authorization} = info
      const init = {session, authorization}
      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return state$.map(state => {
    return div(`.donde`, [
      `create donde`
    ])
  })
}

// This component manages auto-saving
function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const components = {}
  const vtree$ = view(state$, components)

  const local = {
    DOM: vtree$
  }

  return {...mergeSinks(local), DOM: vtree$}
}

export {
  main
}