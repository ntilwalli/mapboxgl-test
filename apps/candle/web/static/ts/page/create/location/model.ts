import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../utils'
import {validateLocation as isValid} from '../listing'
import getModal from './getModal'
import {getSearchAreaFromGeolocation} from './utils'

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

  const locationR = inputs.location$.map(loc => state => {
    const listing = state.get(`listing`)
    const location = listing.profile.location
    const mapSettings = listing.profile.mapSettings
    
    listing.profile.location.info = loc

    if (location.mode !== `map` && listing.profile.mapSettings) {
      listing.profile.mapSettings.center = undefined
      listing.profile.mapSettings.zoom = undefined
    }
     
    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  const modeR = inputs.radio$.skip(1).map(mode => state => {
    const listing = state.get(`listing`)

    listing.profile.location.info = undefined
    listing.profile.location.mode = mode
    listing.profile.mapSettings = undefined;

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
      listing$: inputs.listing$.take(1)
    })
    .switchMap((inputs: any) => {
      const geolocation = inputs.geolocation
      const listing = inputs.listing
      const profile = listing.profile
      const location = profile.location
      //profile.mapSettings = profile.mapSettings || {}
      profile.searchArea = profile.searchArea || getSearchAreaFromGeolocation(geolocation)
      const initial = {
        waiting: false,
        authorization: inputs.authorization,
        listing: listing,
        valid: isValid(listing),
        modal: ``
      }

      return reducer$.startWith(Immutable.Map(initial)).scan((acc, f: Function) => f(acc))//.debounceTime(4)
    })
    .map(x => (<any> x).toJS())
    //.do(x => console.log(`location state...`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

}
