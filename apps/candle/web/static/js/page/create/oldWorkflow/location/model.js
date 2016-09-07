import xs from 'xstream'
import Immutable from 'immutable'
import combineObj from '../../../combineObj'
import {getEmptyListing} from '../../../utils'

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
      .set(`isValid`, isValid(listing.location))
  })

  const locationReducer$ = inputs.location$.map(loc => state => {
    //console.log(`locationReducer`)
    //console.log(loc)
    const listing = state.get(`listing`)// || getEmptyListing()
    //if (!listing.location) listing.location = getBlankLocation()
    listing.location.info = loc
    return state.set(`listing`, listing).set(`isValid`, isValid(listing.location))
  })

  const modeReducer$ = inputs.radio$.drop(1).map(mode => state => {
    //console.log(`modeReducer`)
    const listing = state.get(`listing`)// || getEmptyListing()
    //if (!listing.location) listing.location = getBlankLocation()

    //console.log(`modeReducer`)
    //console.log(listing)
    listing.location.info = undefined
    listing.location.mode = mode

    return state.set(`listing`, listing).set(`isValid`, isValid(listing.location))
  })

  const defaultVicinityReducer$ = inputs.defaultVicinity$.drop(1).map(vicinity => state => {
    //console.log(`defaultVicinityReducer`)
    if (state.get(`vicinityMode`) === `default`) {
      const listing = state.get(`listing`)
      //console.log(`defaultVicinityReducer`)
      listing.location.vicinity = vicinity
      return state.set(`listing`, listing).set(`isValid`, isValid(listing.location))
    } else {
      return state
    }
  })

  const mapVicinityReducer$ = actions.mapVicinity$.map(vicinity => state => {
    //console.log(`mapVicinityReducer`)
    //console.log(vicinity)
    const listing = state.get(`listing`)
    listing.location.vicinity = vicinity
    return state.set(`listing`, listing).set(`vicinityMode`, `map`).set(`isValid`, isValid(listing.location))
  })


  const mapClickReducer$ = actions.mapClick$.map(latLng => state => {
    //console.log(`mapClickReducer`)
    const listing = state.get(`listing`)
    const location = listing.location
    if(location.mode === `map`) {
      location.info = {
        latLng,
        description: undefined
      }

      return state.set(`listing`, listing).set(`isValid`, isValid(listing.location))
    }

    return state
  })

  const locationDescriptionReducer$ = actions.locationDescription$.map(desc => state => {
    //console.log(`locationDescriptionReducer`)
    const listing = state.get(`listing`)
    const location = listing.location
    if(location.mode === `map`) {
      location.info.description = desc

      return state.set(`listing`, listing).set(`isValid`, isValid(listing.location))
    }

    return state
  })

  return xs.merge(
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
      props$: inputs.props$,
      authorization$: inputs.authorization$.take(1),
      userLocation$: inputs.userLocation$.take(1),
      listing$: inputs.listing$.take(1),
      vicinity$: inputs.defaultVicinity$.take(1)
    })
    .map(inputs => {
      const listing = inputs.listing || getEmptyListing()
      listing.location.vicinity = listing.location.vicinity || inputs.vicinity
      const initial = {
        waiting: false,
        authorization: inputs.authorization,
        userLocation: inputs.userLocation,
        listing: listing,
        vicinityMode: 'default',
        isValid: isValid(listing.location),
        showVicinityScreen: false
        //mode: inputs.listing && inputs.listing.mode || undefined,
        //selected: inputs.listing && inputs.listing.selected || undefined
      }

      return reducer$.fold((acc, mod) => mod(acc), Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`location state...`)
    .remember()

}
