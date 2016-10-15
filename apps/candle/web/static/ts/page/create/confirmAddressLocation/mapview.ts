import {toLngLatArray, createFeatureCollection} from '../../../util/map'


function render(state) {
  const listing = state.listing
  const hover = state.hover
  const profile = listing.profile
  const location = profile.location
  const map_settings = profile.map_settings
  const info = location.info
  const anchorId = `modifyLocationMapAnchor`
  const center = toLngLatArray(map_settings.center || info.latLng.data)
  const zoom = map_settings.zoom || 17
  const tile = map_settings && map_settings.tile ? map_settings.tile : `mapbox://styles/mapbox/bright-v9`
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
