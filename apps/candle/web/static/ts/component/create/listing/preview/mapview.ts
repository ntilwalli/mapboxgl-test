import {Observable as O} from 'rxjs'
import {combineObj, createProxy} from '../../../../utils'
import {toLngLatArray, createFeatureCollection} from '../../../../mapUtils'
import {getVenueName, getVenueAddress, getVenueLngLat} from '../../../../helpers/donde'


export default function mapview(state$) {
  return state$.map(state => {
    //console.log(`mapview`, state)
    const {session} = state
    const {listing} = session
    const {donde} = listing
    if (donde) {
      const {type, source, data, lng_lat} = donde
      const anchorId = `location-map`

      const descriptor = {
        controls: {},
        map: {
          container: anchorId, 
          style: `mapbox://styles/mapbox/bright-v9`, //stylesheet location
          center: toLngLatArray(lng_lat), // starting position
          zoom: 15, // starting zoom,
          dragPan: true
        },
        sources: {
          venue: {
            type: `geojson`,
            data: createFeatureCollection(lng_lat, {
              title: getVenueName(donde),
              icon: `marker`
            })
          }
        },
        layers: {
          venue: {
            id: `venue`,
            type: `symbol`,
            source: `venue`,
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
            cursor: `grab`
          }
        },
        options: {
          scrollZoom: false
        }
      }

      return descriptor
    } else {
      return undefined
    }
  }).filter(x => !!x)
}