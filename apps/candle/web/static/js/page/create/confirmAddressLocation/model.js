import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {getEmptyListing, combineObj} from '../../../utils'

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

  const mapMoveReducer$ = actions.mapMove$.map(centerZoom => state => {
    const listing = state.get(`listing`)
    const mapSettings = listing.profile.mapSettings
    mapSettings.center = centerZoom.center
    mapSettings.zoom = centerZoom.zoom
    return state.set(`listing`, listing)
  })

  // const markerDragReducer$ = actions.mapVicinity$.map(vicinity => state => {
  //   //console.log(`mapVicinityReducer`)
  //   //console.log(vicinity)
  //   const listing = state.get(`listing`)
  //   listing.location.info.latLng = {
  //     type: `manual`,
  //     data: latLng
  //   }
  //
  //   return state.set(`listing`, listing)
  // })

  const mapClickReducer$ = actions.mapClick$.map(latLng => state => {
    //console.log(`mapClickReducer`)
    const listing = state.get(`listing`)
    listing.profile.location.info.latLng = {
      type: `manual`,
      data: latLng
    }

    return state.set(`listing`, listing)
  })

  return O.merge(
    mapMoveReducer$,
    //markerDragReducer$,
    mapClickReducer$
  )
}



export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      listing$: inputs.listing$.take(1)
    })
    .map(inputs => {
      return {
        listing: inputs.listing
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod) => mod(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`location state...`, x))
    .publishReplay(1).refCount()

}
