import {toLatLngArray} from '../../../utils'
import VirtualDOM from 'virtual-dom'
const VNode = VirtualDOM.VNode

function render(state) {
  const listing = state.listing
  const profile = listing.profile
  const location = profile.location
  const mapSettings = profile.mapSettings
  const info = location.info
  const anchorId = `modifyLocationMapAnchor`
  const mapClass = `modifyLocationMap`
  const centerZoom = {center: toLatLngArray(mapSettings.center || info.latLng.data), zoom: mapSettings.zoom}
  const properties = {attributes: {class: mapClass}, centerZoom, disablePanZoom: false, anchorId, mapOptions: {zoomControl: true}}
  const tile = mapSettings && mapSettings.tile || `mapbox.streets`

  return new VNode(`map`, properties, [
    new VNode(`tileLayer`, { tile }),
      new VNode(`marker`, { 
        latLng: toLatLngArray(info.latLng.data), 
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
