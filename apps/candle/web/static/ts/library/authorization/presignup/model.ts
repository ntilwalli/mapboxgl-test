import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, checkValidity} from '../../../utils'

function isValid(state) {
  const {name, username, email} = state
  return name.valid && username.valid && email.valid
}
function setValid(state) {
  const name = state.get(`name`)
  const username = state.get(`username`)
  const email = state.get(`email`)
  const type = state.get(`type`)

  return state.set(`valid`, isValid({type, name, username, email}))
}

function reducers(actions, inputs) {
  const {name$, username$, email$, errors$} = inputs
  // const userTypeR = actions.userType$
  //   .map(userType => state => state.set(`type`, userType))

  const name_r = name$
    .skip(1)
    .map(x => state => {
      return setValid(state.set(`name`, x))
    })

  const username_r = username$
    .skip(1)
    .map(x => state => {
      return setValid(state.set(`username`, x))
    })

  const email_r = email$
    .skip(1)
    .map(x => state => {
      return setValid(state.set(`email`, x))
    })

  const errors_r = errors$
    .map(val => state => {
      return state.set(`errors`, (val && val.errors) ? val.errors.filter(x => x.type === `general`).map(x => x.error) : [])
    })

  const show_errors_r = actions.submit$.map(_ => state => {
    return state.set('show_errors', true)
  })

  return O.merge(
    //userTypeR,
    name_r,
    username_r,
    email_r,
    errors_r,
    show_errors_r
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  //const {name$, username$, email$} = inputs
  return combineObj({
    props: inputs.cookie$,
    name$: inputs.name$,//.map(checkValidity),
    username$: inputs.username$,//.map(checkValidity),
    email$: inputs.email$//.map(checkValidity)
  }).take(1)
    .map((info: any) => {
      const {props, name, username, email} = info
      //const userType = initialValue && initialValue.type || `individual`
      //const state = {name, username, email}//, type: userType}
      return {
        ...info,
        valid: isValid(info),
        errors: [],
        show_errors: false
      }
    })
    .switchMap(state => reducer$.startWith(Immutable.Map(state)).scan((acc, f: Function) => f(acc)))
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()

}
