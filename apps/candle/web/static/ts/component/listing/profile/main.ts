import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj} from '../../../utils'
import Immutable = require('immutable')

function intent(sources) {
  return {

  }
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$
    .map(listing => {
      return Immutable.Map({
        listing
      })
    })
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$
    .map(state => {
      const {listing} = state
      const donde = listing.donde
      console.log(donde)
      return div(`.listing-profile`, [
        div([listing.name]),
        div(`#listing-location-map`)
      ])
    })
}

function mapview(state$) {
  return state$
    .map(state => {
      const {listing} = state
      const donde = listing.donde
      const {lng, lat} = donde.lng_lat
      const anchorId = `listing-location-map`
      let zoom = 15
      const center = [lng, lat]
      const tile = `mapbox://styles/mapbox/bright-v9`

      const descriptor = {
        controls: {},
        map: {
          container: anchorId, 
          style: tile,
          center,
          zoom,
          dragPan: true
        }
        // sources: markerLoc ? {
        //   marker: {
        //     type: `geojson`,
        //     data: createFeatureCollection(location.info.lngLat, {
        //       icon: `marker`
        //     })
        //   }
        // } : undefined,
        // layers: markerLoc ? {
        //   marker: {
        //     id: `marker`,
        //     type: `symbol`,
        //     source: `marker`,
        //     layout: {
        //         "icon-image": `{icon}-15`,
        //         "icon-size": 1.5,
        //         // "text-field": `{title}`,
        //         "text-font": [`Open Sans Semibold`, `Arial Unicode MS Bold`],
        //         "text-offset": [0, 0.6],
        //         "text-anchor": `top`
        //     }
        //   }
        // } : undefined,
        // canvas: {
        //   style: {
        //     cursor: `grab`
        //   }
        // }
      }

      return descriptor
    })
}



export function main(sources, inputs) {
  const actions = intent(sources)
  console.log(inputs)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  const mapjson$ = mapview(state$)

  return {
    DOM: vtree$, //O.of(`Hello darling`),
    MapJSON: mapjson$
  }
}
