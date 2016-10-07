import {toLngLatArray, createFeatureCollection} from '../../../util/map'
import VirtualDOM from 'virtual-dom'
const VNode = VirtualDOM.VNode

function render(state) {
  const listing = state.listing
  const hover = state.hover
  const profile = listing.profile
  const location = profile.location
  const mapSettings = profile.mapSettings
  const info = location.info
  const anchorId = `modifyLocationMapAnchor`
  const center = toLngLatArray(mapSettings.center || info.latLng.data)
  const zoom = mapSettings.zoom || 17
  const tile = mapSettings && mapSettings.tile ? mapSettings.tile : `mapbox://styles/mapbox/bright-v9`
  const descriptor = {
    controls: {},
    map: {
      container: anchorId, 
      style: tile, //stylesheet location
      center, // starting position
      zoom, // starting zoom,
      dragPan: hover ? false : true
    },
    sources: {
      marker: {
        type: `geojson`,
        data: createFeatureCollection(location.info.latLng.data, {
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
        cursor: hover ? `move` : `pointer`
      }
    }
  }

  return descriptor
}

export default function view(state$) {
  return state$
    .map(state => render(state))
    .filter(x => !!x)
}
