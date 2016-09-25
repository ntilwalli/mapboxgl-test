import {toLatLngArray} from '../../../utils'
import {getOffsetCenter} from '../../../util/map'
import VirtualDOM from 'virtual-dom'
const VNode = VirtualDOM.VNode

function render(state) {
  const listing = state.listing
  const profile = listing.profile
  const location = profile.location
  const mode = location.mode
  const mapSettings = profile.mapSettings
  const info = location.info
  const anchorId = `listingCardMapAnchor`
  const mapClass = `listingCardMap`

  let markerLatLng
  if (mode === `venue`)
    markerLatLng = info.data.latLng
  else if (mode === `address`)
    markerLatLng = info.latLng.data
  else if (mode === `map`)
    markerLatLng = info.latLng

  const center = toLatLngArray((mapSettings && mapSettings.center) || markerLatLng)
  const zoom = (mapSettings && mapSettings.zoom) || 15

  const centerZoom = {center, zoom}
  const properties = {attributes: {class: mapClass}, centerZoom, offset: [100, 0], disablePanZoom: true, anchorId, mapOptions: {zoomControl: false}}
  const tile = mapSettings && mapSettings.tile || `mapbox.streets`

  return new VNode(`map`, properties, [
    new VNode(`tileLayer`, { tile }),
      new VNode(`marker`, { 
        latLng: toLatLngArray(markerLatLng), 
        attributes: {id: `latLngMarker`},
        options: {
          draggable: true
        }
      }, [
            // new VNode(`divIcon`, {
            //   options: {
            //     iconSize: 80,
            //     iconAnchor: [40, -10],
            //     html: `${event.core.name}`
            //   },
            //   attributes: {id: divIconId}
            // }, [], divIconId)
          ],
          `latLngMarker`)
  ])

}

export default function view(state$) {
  return state$
    .map(state => render(state))
    .filter(x => !!x)
}
