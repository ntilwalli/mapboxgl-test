import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, spread, checkValidity} from '../../../utils'

function isValid(state) {
  const {username, password} = state
  return username && password
}

function setValid(state) {
  const username = state.get(`username`)
  const password = state.get(`password`)

  return state.set(`valid`, isValid({username, password}))
}



function reducers(actions, inputs) {
  const {username$, password$, error$} = inputs
  const usernameR = username$.skip(1)
    .map(x => state => {
      if (x.valid)
        return setValid(state.set(`username`, x.value))
      else
        return setValid(state.set(`username`, null))
    })

  const passwordR = password$.skip(1)
    .map(x => state => {
      if (x.valid)
        return setValid(state.set(`password`, x.value))
      else
        return setValid(state.set(`password`, null))
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
    username$: inputs.username$.map(checkValidity),
    password$: inputs.password$.map(checkValidity)
  }).take(1)
   .map(inputs => {
      const valid = isValid(inputs)
      return spread(inputs, {
        valid,
        errors: []
      })
    })
    .switchMap(initialState=> {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f: Function) => f(acc))
    })
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()

}
