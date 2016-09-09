import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../../../utils'
import {getEmptyListing} from '../listing'

function isValid (location) {
  // if (location.mode === `map`) {
  //   return location.info
  //
  // } else if (location.mode === `venue`) {
  //
  //   return location.info
  //
  // } else if (location.mode === `address`) {
  //
  // }

  return location.info
}

function reducers(actions, inputs) {

  const showVicinityScreenReducer$ = actions.vicinityScreen$
    .map(show => state => {
      //console.log(`vicinityScreen`)
      return state.set(`showVicinityScreen`, show)
    })

  const vicinityFromScreenReducer$ = inputs.vicinityFromScreen$.map(vicinity => state => {
    const listing = state.get(`listing`)
    listing.location.vicinity = vicinity
    return state.set(`listing`, listing)
      .set(`vicinityMode`, `screen`)
      .set(`showVicinityScreen`, false)
      .set(`valid`, isValid(listing.location))
  })

  const locationReducer$ = inputs.location$.map(loc => state => {
    //console.log(`locationReducer`)
    //console.log(loc)
    const listing = state.get(`listing`)// || getEmptyListing()
    //if (!listing.location) listing.location = getBlankLocation()
    listing.location.info = loc
    return state.set(`listing`, listing).set(`valid`, isValid(listing.location))
  })

  const modeReducer$ = inputs.radio$.skip(1).map(mode => state => {
    //console.log(`modeReducer`)
    const listing = state.get(`listing`)// || getEmptyListing()
    //if (!listing.location) listing.location = getBlankLocation()

    //console.log(`modeReducer`)
    //console.log(listing)
    listing.profile.location.info = undefined
    listing.profile.location.mode = mode

    return state.set(`listing`, listing).set(`valid`, isValid(listing.location))
  })

  const defaultVicinityReducer$ = inputs.defaultVicinity$.skip(1).map(vicinity => state => {
    //console.log(`defaultVicinityReducer`)
    if (state.get(`vicinityMode`) === `default`) {
      const listing = state.get(`listing`)
      //console.log(`defaultVicinityReducer`)
      listing.location.vicinity = vicinity
      return state.set(`listing`, listing).set(`valid`, isValid(listing.location))
    } else {
      return state
    }
  })

  const mapVicinityReducer$ = actions.mapVicinity$.map(vicinity => state => {
    //console.log(`mapVicinityReducer`)
    //console.log(vicinity)
    const listing = state.get(`listing`)
    listing.location.vicinity = vicinity
    return state.set(`listing`, listing).set(`vicinityMode`, `map`).set(`valid`, isValid(listing.location))
  })


  const mapClickReducer$ = actions.mapClick$.map(latLng => state => {
    //console.log(`mapClickReducer`)
    const listing = state.get(`listing`)
    const location = listing.profile.location
    if(location.mode === `map`) {
      location.info = {
        latLng,
        description: undefined
      }

      return state.set(`listing`, listing).set(`valid`, isValid(listing.location))
    }

    return state
  })

  const locationDescriptionReducer$ = actions.locationDescription$.map(desc => state => {
    //console.log(`locationDescriptionReducer`)
    const listing = state.get(`listing`)
    const location = listing.profile.location
    if(location.mode === `map`) {
      location.info.description = desc

      return state.set(`listing`, listing).set(`valid`, isValid(listing.location))
    }

    return state
  })

  return O.merge(
    showVicinityScreenReducer$,
    vicinityFromScreenReducer$,
    locationReducer$,
    modeReducer$,
    mapVicinityReducer$,
    defaultVicinityReducer$,
    mapClickReducer$,
    locationDescriptionReducer$
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      //props$: inputs.props$,
      authorization$: inputs.authorization$.take(1),
      geolocation$: inputs.geolocation$.take(1),
      listing$: inputs.listing$.take(1),
      vicinity$: inputs.defaultVicinity$.take(1)
    })
    .switchMap(inputs => {
      const listing = inputs.listing
      listing.profile.location.vicinity = listing.profile.location.vicinity || inputs.vicinity
      const initial = {
        waiting: false,
        authorization: inputs.authorization,
        geolocation: inputs.geolocation,
        listing: listing,
        vicinityMode: 'default',
        valid: isValid(listing.profile.location),
        showVicinityScreen: false
      }

      return reducer$.startWith(Immutable.Map(initial)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`location state...`, x))
    .map(x => {
      return x
    })
    .cache(1)

}
