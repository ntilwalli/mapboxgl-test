import {Observable as O} from 'rxjs'
import Cycle from '@cycle/rxjs-run'
import {makeDOMDriver, div} from '@cycle/dom'
import {makeMapJSONDriver} from 'cycle-mapboxgl'


function view() {
  const dom$ = O.of(undefined).map(x => {
    return div('.root-container', [
      div('#the-map', [])
    ])
})

  return dom$
}

function createFeatureCollection(lngLat, properties?) {
  return {
      type: "FeatureCollection",
      features: [{
          type: "Feature",
          geometry: {
              type: "Point",
              coordinates: [lngLat.lng, lngLat.lat]
          },
          properties
      }]
  }
}

function geoToLngLat(x) {
  const {latitude, longitude} = x.data.coords
  return {lng: longitude, lat: latitude}
}

function toLngLatArray(x) {
  if (x.lng && x.lat) {
    return [x.lng, x.lat]
  }

  throw new Error(`Invalid lng/lat object`)
}

function mapview() {
  return O.of({lat: 37.7749, lng: -122.4194})
    .delay(10)
    .map(state => {
      const {lng, lat} = state
      const anchorId = 'the-map'
      let zoom = 10
      const center = [lng, lat]
      const tile = `mapbox://styles/mapbox/bright-v9`

      const descriptor = {
        controls: {},
        map: {
          container: anchorId, 
          style: tile,
          center,
          zoom,
          dragPan: true,
          scrollZoom: false
        },
        sources: {
          marker: {
            type: `geojson`,
            data: createFeatureCollection(state, {
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
        }
      }

      return descriptor
    })
}

function main(sources) {

  const vtree$ = view()
  const mapvtree$ = mapview()

  return {
    DOM: vtree$,
    MapJSON: mapvtree$ 
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver(`#app-main`),
  MapJSON: makeMapJSONDriver(
    `pk.eyJ1IjoibXJyZWRlYXJzIiwiYSI6ImNpbHJsZnJ3NzA4dHZ1bGtub2hnbGVnbHkifQ.ph2UH9MoZtkVB0_RNBOXwA`),
})
