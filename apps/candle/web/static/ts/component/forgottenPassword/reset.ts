import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div} from '@cycle/dom'
import {combineObj, mergeSinks, componentify, toMessageBusMainError} from '../../utils'
import queryString = require('query-string')
import Navigator from '../../library/navigators/simple'
import ResetPasswordQuery from '../../query/resetPassword'

function intent(sources) {
  const {Router, Storage} = sources

  return {
    submit$: O.never()
  }
}

function reducers(actions, inputs) {
  return O.merge(O.never())
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      token$: inputs.props$
    })
    .switchMap((info: any) => {
      return reducer$.startWith(Immutable.fromJS({
        token: info.token,
        password: undefined,
        confirm_password: undefined,
        valid: false
      }))
      .scan((acc, f: Function) => f(acc))
      .map((x: any) => x.toJS())
      .publishReplay(1).refCount()
    })
}

function renderForm(state) {
  return div('.reset-password-form', ['Reset password form'])
}

function view(state$, components) {
  return combineObj({
    state$, 
    components$: combineObj(components)
  })
    .map((info: any) => {
      const {state, components} = info
      return div('.forgotten-password-reset', [
        components.navigator,
        renderForm(state)
      ])
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const navigator = Navigator(sources, inputs)

  const components = {
    navigator: navigator.DOM,
  }

  const vtree$ = view(state$, components)
  const reset_password_query = ResetPasswordQuery(sources, {
    props$: actions.submit$
      .withLatestFrom(state$, (_, state: any) => {
        return state
      })
      .filter((state: any) => state.valid)
      .map((state: any) => {
        return {
          token: state.token,
          password: state.password
        }
      })
  })

  const to_storage$ = O.of({
    action: 'removeItem',
    key: 'forgotten_password_token'
  })

  const merged = mergeSinks(navigator)
  return {
    ...merged,
    DOM: vtree$,
    Storage: O.merge(
      merged.Storage,
      to_storage$
    ),
    Router: O.merge(
      merged.Router,
      reset_password_query.success$
        .mapTo({
          pathname: '/?modal=login',
          type: 'replace'
        }).delay(10)
    ),
    MessageBus: O.merge(
      merged.MessageBus,
      reset_password_query.error$.map(toMessageBusMainError)
    )
  }
}

