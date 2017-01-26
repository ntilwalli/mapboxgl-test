import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, checkValidity} from '../../../utils'

function isValid(state) {
  const {name, username, email, password} = state
  if (name.valid && username.valid && email.valid && password.valid) {
    return true
  } else {
    return false
  }
}

function setValid(state) {
  const name = state.get(`name`)
  const username = state.get(`username`)
  const email = state.get(`email`)
  const password = state.get(`password`)

  return state.set(`valid`, isValid({name, username, email, password}))
}

function reducers(actions, inputs) {
  const {name$, username$, email$, password$, errors$} = inputs

  const name_r = name$.skip(1)
    .map(x => state => {
      return setValid(state.set(`name`, x))
    })

  const username_r = username$.skip(1)
    .map(x => state => {
      return setValid(state.set(`username`, x))
    })

  const email_r = email$.skip(1)
    .map(x => state => {
      return setValid(state.set(`email`, x))
    })

  const password_r = password$.skip(1)
    .map(x => state => {
      return setValid(state.set(`password`, x))
    })

  const errors_r = errors$.map(val => state => {
    return state.set(`errors`, (val && val.errors) ? val.val.filter(x => x.type === `general`).map(x => x.error) : [])
  })

  const show_errors_r = actions.submit$.map(_ => state => {
    return state.set('show_errors', true)
  })

  return O.merge(
    name_r,
    username_r,
    email_r,
    password_r,
    errors_r,
    show_errors_r
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    props$: inputs.props$ || O.of({}),
    name$: inputs.name$,//.map(checkValidity),
    username$: inputs.username$,//.map(checkValidity),
    email$: inputs.email$,//.map(checkValidity),
    password$: inputs.password$,//.map(checkValidity)
  })
  .take(1)
  .map((inputs: any) => {
    const {props, name, username, email, password} = inputs
    const state = {
      props,
      name,
      username,
      email,
      password
    }

    return {
      ...inputs,
      valid: isValid(inputs),
      errors: [],
      show_errors: false
    }
  })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod: Function) => mod(acc))
    })
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()

}