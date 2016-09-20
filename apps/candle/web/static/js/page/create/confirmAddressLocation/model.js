import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../../../utils'

function reducers(actions, inputs) {

  const mapMoveR = actions.mapMove$.map(centerZoom => state => {
    const listing = state.get(`listing`)
    listing.profile.mapSettings.center = centerZoom.center
    listing.profile.mapSettings.zoom = centerZoom.zoom
    return state.set(`listing`, listing)

  })

  const markerMoveR = actions.markerMove$.map(latLng => state => {
    //console.log(`markerMoveReducer`, latLng)
    const listing = state.get(`listing`)
    listing.profile.location.info.latLng = {
      type: `manual`,
      data: latLng
    }
  
    return state.set(`listing`, listing)
  })

  const mapClickR = actions.mapClick$.map(latLng => state => {
    const listing = state.get(`listing`)
    listing.profile.location.info.latLng = {
      type: `manual`,
      data: latLng
    }

    return state.set(`listing`, listing)
  })

  return O.merge(
    mapMoveR,
    markerMoveR,
    mapClickR
  )
}



export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      listing$: inputs.listing$.take(1)
    })
    .map(inputs => {
      const listing = inputs.listing
      listing.profile.mapSettings = listing.profile.mapSettings || {
        center: listing.profile.location.info.latLng.data,
        zoom: 17,
        tile: `mapbox.streets`
      }

      return {
        listing,
        valid: true
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod) => mod(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`confirm address location state...`, x))
    .publishReplay(1).refCount()

}
