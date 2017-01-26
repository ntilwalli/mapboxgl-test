import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, checkValidity} from '../../../utils'

function reducers(actions, inputs) {
  const email_r = inputs.email$
    .map(x => state => {
      if (x.valid) {
        return state.set('email', x.data).set('valid', true).set('errors', Immutable.fromJS([]))
      } else {
        return state.set('email', undefined).set('valid', false).set('errors', Immutable.fromJS(x.errors))
      }
    })
  
  const show_errors_r = actions.submit$.map(_ => state => {
    return state.set('show_errors', true)
  })

  return O.merge(
    email_r, show_errors_r
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return O.of(undefined)
    .map(inputs => {
      return {
        email: undefined,
        valid: false,
        errors: [],
        show_errors: false
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.fromJS(initialState)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

}
