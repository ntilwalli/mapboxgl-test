import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, spread, checkValidity} from '../../../utils'

function isValid(state) {
  const {type, name, username, email} = state
  return type && name && username && email
}
function setValid(state) {
  const name = state.get(`name`)
  const username = state.get(`username`)
  const email = state.get(`email`)
  const type = state.get(`type`)

  return state.set(`valid`, isValid({type, name, username, email}))
}

function reducers(actions, inputs) {
  const {name$, username$, email$, error$} = inputs
  const userTypeR = actions.userType$
    .map(userType => state => state.set(`type`, userType))

  const nameR = name$.skip(1)
    .map(x => state => {
      if (x.valid)
        return setValid(state.set(`name`, x.value))
      else
        return setValid(state.set(`name`, null))
    })

  const usernameR = username$.skip(1)
    .map(x => state => {
      if (x.valid)
        return setValid(state.set(`username`, x.value))
      else
        return setValid(state.set(`username`, null))
    })

  const emailR = email$.skip(1)
    .map(x => state => {
      if (x.valid)
        return setValid(state.set(`email`, x.value))
      else
        return setValid(state.set(`email`, null))
    })

  const errorR = error$.map(error => state => {
    return state.set(`errors`, (error && error.errors) ? error.errors.filter(x => x.type === `general`).map(x => x.error) : [])
  })

  return O.merge(
    userTypeR,
    nameR,
    usernameR,
    emailR,
    errorR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  //const {name$, username$, email$} = inputs
  return combineObj({
    initialValue$: inputs.initialValue$ || O.of({}),
    name$: inputs.name$.map(checkValidity),
    username$: inputs.username$.map(checkValidity),
    email$: inputs.email$.map(checkValidity)
  }).take(1)
    .map((info: any) => {
      const {initialValue, name, username, email} = info
      const userType = initialValue && initialValue.type || `individual`
      const state = {name, username, email, type: userType}
      return spread(state, {
        valid: isValid(state),
        errors: []
      })
    })
    .switchMap(state => reducer$.startWith(Immutable.Map(state)).scan((acc, f: Function) => f(acc)))
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()

}
