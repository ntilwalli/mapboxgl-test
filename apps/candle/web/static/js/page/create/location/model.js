import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../../../utils'
import {getEmptyListing, validateLocation as isValid} from '../listing'
import getModal from './getModal'

function reducers(actions, inputs) {

  const showModalR = actions.showSearchAreaScreen$
    .map(show => state => {
      return state.set(`modal`, `searchArea`)
    })

  const hideModalR = inputs.hideModal$
    .map(show => state => {
      return state.set(`modal`, ``)
    })

  const searchAreaFromScreenR = inputs.searchAreaFromScreen$.map(searchArea => state => {
    const listing = state.get(`listing`)
    listing.profile.searchArea = searchArea
    return state.set(`listing`, listing)
      .set(`modal`, ``)
      .set(`valid`, isValid(listing))
  })

  const locationR = inputs.location$.skip(1).map(loc => state => {
    const listing = state.get(`listing`)
    listing.profile.location.info = loc
    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  const modeR = inputs.radio$.skip(1).map(mode => state => {
    const listing = state.get(`listing`)

    listing.profile.location.info = undefined
    listing.profile.location.mode = mode

    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  return O.merge(
    showModalR,
    hideModalR,
    searchAreaFromScreenR,
    locationR,
    modeR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      authorization$: inputs.authorization$.take(1),
      geolocation$: inputs.geolocation$.take(1),
      listing$: inputs.listing$.take(1),
      defaultSearchArea$: inputs.defaultSearchArea$.take(1)
    })
    .switchMap(inputs => {
      const listing = inputs.listing
      const profile = listing.profile
      const location = profile.location
      profile.searchArea = profile.searchArea || inputs.defaultSearchArea
      const initial = {
        waiting: false,
        authorization: inputs.authorization,
        geolocation: inputs.geolocation,
        listing: listing,
        valid: isValid(listing),
        modal: ``
      }

      return reducer$.startWith(Immutable.Map(initial)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`location state...`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

}
