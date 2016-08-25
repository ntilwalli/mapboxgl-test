import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../../../utils'
import {getEmptyListing, validateMeta as isValid} from '../listing'


function setValidity(state) {
  const listing = state.get(`listing`)
  return state.set(`valid`, isValid(listing))
}

function reducers(actions, inputs) {

  const creationTypeR = inputs.creationType$.map(val => state => {
    const listing = state.get(`listing`)
    const meta = listing.meta
    meta.creationType = val
    if (val === `group`) {
      meta.eventType = undefined
    }

    return setValidity(state.set(`listing`, listing))
  })

  const visibilityR = inputs.visibility$.map(val => state => {
    const listing = state.get(`listing`)
    const meta = listing.meta
    meta.visibility = val

    return setValidity(state.set(`listing`, listing))
  })

  const eventTypeR = inputs.eventType$.map(val => state => {
    const listing = state.get(`listing`)
    const meta = listing.meta
    meta.eventType = val

    return setValidity(state.set(`listing`, listing))
  })

  return O.merge(
    creationTypeR,
    visibilityR,
    eventTypeR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      listing$: inputs.listing$
    })
    .take(1)
    .map(inputs => {
      const listing = inputs.listing
      const valid = isValid(listing)
      return {
        waiting: false,
        listing,
        valid
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod) => mod(acc)))
    .map(x => x.toJS())
    .cache(1)

}
