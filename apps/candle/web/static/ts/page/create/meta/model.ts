import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../utils'
import {getEmptyListing, validateMeta as isValid} from '../listing'


function setValidity(state) {
  const listing = state.get(`listing`)
  return state.set(`valid`, isValid(listing))
}

function reducers(actions, inputs) {

  const creationTypeR = inputs.creationType$.map(val => state => {
    const listing = state.get(`listing`)
    listing.type = val
    if (val === `group`) {
      const profile = listing.profile
      profile.meta.event_type = undefined
    }

    listing.profile.time = undefined
    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  const visibilityR = inputs.visibility$.map(val => state => {
    const listing = state.get(`listing`)
    const {profile} = listing
    const {meta} = profile
    meta.visibility = val

    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  const eventTypeR = inputs.eventType$.map(val => state => {
    const listing = state.get(`listing`)
    const {profile} = listing
    const {meta} = profile
    meta.event_type = val

    return state.set(`listing`, listing).set(`valid`, isValid(listing))
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
      listing$: actions.listing$
    })
    .take(1)
    .map((inputs: any) => {
      const listing = inputs.listing
      const valid = isValid(listing)
      return {
        waiting: false,
        listing,
        valid
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod: Function) => mod(acc)))
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()

}
