import {toLngLatArray, createFeatureCollection} from '../../../util/map'
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

  let markerLatLng
  if (mode === `venue`)
    markerLatLng = info.data.latLng
  else if (mode === `address`)
    markerLatLng = info.latLng.data
  else if (mode === `map`)
    markerLatLng = info.latLng

  const center = (mapSettings && mapSettings.center) || markerLatLng
  const zoom = (mapSettings && mapSettings.zoom) || 15

  const tile = mapSettings && mapSettings.tile ? mapSettings.tile : `mapbox://styles/mapbox/bright-v9`
  const descriptor = {
    controls: {},
    map: {
      container: anchorId, 
      style: tile, //stylesheet location
      center: toLngLatArray(center), // starting position
      zoom, // starting zoom,
      dragPan: false
    },
    sources: {
      marker: {
        type: `geojson`,
        data: createFeatureCollection(center, {
          icon: `marker`
        })
      }
    },
    layers: {
      marker: {
        id: `marker`,
        type: `symbol`,
        source: `marker`,
        layout: {
            "icon-image": `{icon}-15`,
            "icon-size": 1.5,
            // "text-field": `{title}`,
            "text-font": [`Open Sans Semibold`, `Arial Unicode MS Bold`],
            "text-offset": [0, 0.6],
            "text-anchor": `top`
        }
      }
    },
    canvas: {
      style: {
        cursor: `inherit`
      }
    },
    options: {
      offset: [100, 0]
    }
  }

  return descriptor
}

export default function view(state$) {
  return state$
    .map(state => render(state))
    .filter(x => !!x)
}
