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

  const searchAreaFromScreenR = inputs.searchAreaFromScreen$.map(search_area => state => {
    const listing = state.get(`listing`)
    listing.profile.search_area = search_area
    return state.set(`listing`, listing)
      .set(`modal`, ``)
      .set(`valid`, isValid(listing))
  })

  const locationR = inputs.location$.map(loc => state => {
    const listing = state.get(`listing`)
    const location = listing.profile.location
    const map_settings = listing.profile.map_settings
    
    listing.profile.location.info = loc

    if (location.mode !== `map` && listing.profile.map_settings) {
      listing.profile.map_settings.center = undefined
      listing.profile.map_settings.zoom = undefined
    }
     
    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  const modeR = inputs.radio$.skip(1).map(mode => state => {
    const listing = state.get(`listing`)

    listing.profile.location.info = undefined
    listing.profile.location.mode = mode
    listing.profile.map_settings = undefined;

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
      //profile.map_settings = profile.map_settings || {}
      profile.search_area = profile.search_area || getSearchAreaFromGeolocation(geolocation)
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
