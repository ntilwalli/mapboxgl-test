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

  const mapMoveReducer$ = actions.mapMove$.map(centerZoom => state => {
    const listing = state.get(`listing`)
    const mapSettings = listing.location.mapSettings
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
    listing.location.info.latLng = {
      type: `manual`,
      data: latLng
    }

    return state.set(`listing`, listing)
  })

  return xs.merge(
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
      const listing = inputs.listing
      const initial = {
        listing: listing,
      }

      return reducer$.fold((acc, mod) => mod(acc), Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`location state...`)
    .remember()

}
