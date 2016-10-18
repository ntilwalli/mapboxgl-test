import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, spread, checkValidity} from '../../../utils'
import {validateDescription as isValid} from '../listing'

function setValid(state) {
  const session = state.get(`session`)

  return state.set(`valid`, isValid(session.listing))
}

function reducers(actions, inputs) {
  const titleR = inputs.title$.skip(1).map(checkValidity).map(val => state => {
    const session = state.get(`session`)
    const {listing} = session
    const {profile} = listing
    profile.title = val
    return setValid(state.set(`session`, session))
  })
  const descriptionR = actions.description$.map(val => state => {
    const session = state.get(`session`)
    const {listing} = session
    const {profile} = listing
    profile.description = val
    return setValid(state.set(`session`,session))
  })
  const shortDescriptionR = actions.shortDescription$.map(val => state => {
    const session = state.get(`session`)
    const {listing} = session
    const {profile} = listing
    profile.short_description = val
    return setValid(state.set(`session`, session))
  })
  //const categoriesR = inputs.categories$.map(val => state => {
  //       return setValid(state.set(`categories`, val))
  // })
  const categoriesR = actions.categories$.map(val => state => {
    const session = state.get(`session`)
    const {listing} = session
    const {profile} = listing
    const categories = val.split(/[\s,]+/).filter(x => x.length > 0)
    profile.categories = categories
    return setValid(state.set(`session`, session))
  })


  return O.merge(
    titleR, descriptionR, shortDescriptionR, categoriesR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.session$.take(1)
    .map(session => {
      const valid = isValid(session.listing)
      return {
        session,
        valid
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f: Function) => f(acc)))
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()
}
