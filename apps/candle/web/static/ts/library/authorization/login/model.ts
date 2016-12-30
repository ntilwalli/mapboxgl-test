import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, checkValidity} from '../../../utils'

function isValid(state) {
  const {username, password} = state
  return username.errors.length === 0 && password.errors.length === 0
}

function setValid(state) {
  const username = state.get(`username`)
  const password = state.get(`password`)

  return state.set(`valid`, isValid({username, password}))
}



function reducers(actions, inputs) {
  const {username$, password$, error$} = inputs
  const usernameR = username$
    .map(x => state => {
      return setValid(state.set(`username`, x))
    })

  const passwordR = password$
    .map(x => state => {
      return setValid(state.set(`password`, x))
    })

  const errorR = error$.map(error => state => {
    return state.set(`errors`, (error && error.errors) ? error.errors.filter(x => x.type === `general`).map(x => x.error) : [])
  })

  return O.merge(
    usernameR,
    passwordR,
    errorR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    username$: inputs.username$,//.map(checkValidity),
    password$: inputs.password$,//.map(checkValidity)
    props$: inputs.props$ || O.of({})
  }).take(1)
   .map(inputs => {
      const valid = false //isValid(inputs)
      return {
        ...inputs,
        valid,
        errors: []
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f: Function) => f(acc))
    })
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()

}
