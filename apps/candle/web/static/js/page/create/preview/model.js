import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj, spread, checkValidity} from '../../../utils'
import {validateDescription as isValid} from '../listing'

function setValid(state) {
  const listing = state.get(`listing`)

  return state.set(`valid`, isValid(listing))
}

function reducers(actions, inputs) {
  const titleR = inputs.title$.skip(1).map(checkValidity).map(val => state => {
    const listing = state.get(`listing`)
    const {profile} = listing
    const {description} = profile
    description.title = val
    return setValid(state.set(`listing`, listing))
  })
  const descriptionR = actions.description$.map(val => state => {
    const listing = state.get(`listing`)
    const {profile} = listing
    const {description} = profile
    description.description = val
    return setValid(state.set(`listing`,listing))
  })
  const shortDescriptionR = actions.shortDescription$.map(val => state => {
    const listing = state.get(`listing`)
    const {profile} = listing
    const {description} = profile
    description.shortDescription = val
    return setValid(state.set(`listing`, listing))
  })
  //const categoriesR = inputs.categories$.map(val => state => {
  //       return setValid(state.set(`categories`, val))
  // })
  const categoriesR = actions.categories$.map(val => state => {
    const listing = state.get(`listing`)
    const {profile} = listing
    const {description} = profile
    const categories = val.split(/[\s,]+/).filter(x => x.length > 0)
    description.categories = categories
    return setValid(state.set(`listing`, listing))
  })


  return O.merge(
    titleR, descriptionR, shortDescriptionR, categoriesR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    listing$: inputs.listing$.take(1),
    authorization$: inputs.authorization$.take(1)
  })
    .map(info => {
      const {listing, authorization} = info
      const valid = isValid(listing)
      return {
        authorization,
        listing,
        valid
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc)))
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}
