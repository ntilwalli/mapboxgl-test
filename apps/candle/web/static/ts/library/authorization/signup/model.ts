import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, spread, checkValidity} from '../../../utils'

function isValid(state) {
  const {name, username, email, password, type} = state
  if (name && username && email && password && type) {
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
  const type = state.get(`type`)

  return state.set(`valid`, isValid({name, username, email, password, type}))
}

function reducers(actions, inputs) {
  const {name$, username$, email$, password$, errors$} = inputs
  const userTypeR = actions.userType$
    .map(userType => state => state.set(`type`, userType))

  const nameR = name$.skip(1)
    .map(x => state => {
      return setValid(state.set(`name`, x))
    })

  const usernameR = username$.skip(1)
    .map(x => state => {
      return setValid(state.set(`username`, x))
    })

  const emailR = email$.skip(1)
    .map(x => state => {
      return setValid(state.set(`email`, x))
    })

  const passwordR = password$.skip(1)
    .map(x => state => {
      return setValid(state.set(`password`, x))
    })

  const errorsR = errors$.map(val => state => {
    return state.set(`errors`, (val && val.errors) ? val.val.filter(x => x.type === `general`).map(x => x.error) : [])
  })
  

  return O.merge(
    userTypeR,
    nameR,
    usernameR,
    emailR,
    passwordR,
    errorsR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    initialValue$: inputs.initialValue$ ? inputs.initialValue$.take(1) : O.of({}),
    name$: inputs.name$,//.map(checkValidity),
    username$: inputs.username$,//.map(checkValidity),
    email$: inputs.email$,//.map(checkValidity),
    password$: inputs.password$,//.map(checkValidity)
  })
  .take(1)
  .map((inputs: any) => {
    const {initialValue, name, username, email, password} = inputs
    const state = {
      type: initialValue && initialValue.type || `individual`,
      name,
      username,
      email,
      password
    }

    return spread(state, {
      valid: isValid(state),
      errors: []
    })
  })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod: Function) => mod(acc))
    })
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()

}