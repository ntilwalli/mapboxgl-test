import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../utils'

function reducers(actions, inputs) {

  const mapMoveR = actions.mapMove$.map(centerZoom => state => {
    const listing = state.get(`listing`)
    listing.profile.mapSettings.center = centerZoom.center
    listing.profile.mapSettings.zoom = centerZoom.zoom
    return state.set(`listing`, listing)

  })

  const markerMoveR = actions.markerMove$.map(lngLat => state => {
    const listing = state.get(`listing`)
    listing.profile.location.info.latLng = {
      type: `manual`,
      data: lngLat
    }
  
    return state.set(`listing`, listing)
  })

  const mapClickR = actions.mapClick$.map(lngLat => state => {
    const listing = state.get(`listing`)
    listing.profile.location.info.latLng = {
      type: `manual`,
      data: lngLat
    }

    return state.set(`listing`, listing)
  })

  const markerHoverR = actions.markerHover$.map(hover => state => {
    return state.set(`hover`, hover)
  })

  return O.merge(
    mapMoveR,
    markerMoveR,
    mapClickR,
    markerHoverR
  )
}



export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      listing$: inputs.listing$.take(1)
    })
    .map((inputs: any) => {
      const listing = inputs.listing
      listing.profile.mapSettings = listing.profile.mapSettings || {
        center: listing.profile.location.info.latLng.data,
        zoom: 17,
        tile: undefined
      }

      return {
        listing,
        valid: true,
        hover: false
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f: Function) => f(acc))
    })
    .map(x => (<any> x).toJS())
    //.do(x => console.log(`confirm address location state...`, x))
    .publishReplay(1).refCount()

}
