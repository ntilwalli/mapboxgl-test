import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeComponent, 
  getVicinityFromGeolocation, getNormalizedRegion} from '../../../utils'
import {getCenterZoom, toLngLatArray, createFeatureCollection} from '../../../util/map'
import Immutable from 'immutable'
import VirtualDOM from 'virtual-dom'

const VNode = VirtualDOM.VNode

const MAP_ANCHOR_ID = `user-location-map`
const MAP_ROOT_CLASS = `location-map`

function intent(sources) {
  //const {DOM, MapDOM} = sources

  return {}
}

function model(actions, inputs) {
  return combineObj({
    authorization$: inputs.authorization$,
    geolocation$: inputs.geolocation$
  })
  .map(inputs => {
    return inputs
  })
  .switchMap(initialState => {
    return O.never().startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
  })
  .map(x => x.toJS())
  .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    const vicinity = getVicinityFromGeolocation(state.geolocation)
    const normalizedRegion = getNormalizedRegion(vicinity.region)
    let regionString
    if (normalizedRegion.type === `somewhere`) {
      const {locality} = normalizedRegion.data
      const region = normalizedRegion.data.region
      regionString = `${locality}, ${region}`
    } else {
      regionString = normalizedRegion.type
    }

    return div(`.user-location-map-component`, [
      div(`.region-display`, [
        regionString
      ]),
      div(`#${MAP_ANCHOR_ID}`)
    ])
  })
}

function mapview(state$) {
  return state$.map(state => {
    const {geolocation} = state
    const {user} = geolocation
    const vicinity = getVicinityFromGeolocation(geolocation)
    const normalizedRegion = getNormalizedRegion(vicinity.region)
    const {position, region} = vicinity
    const anchorId = MAP_ANCHOR_ID

    const userPosition = user && user.position

    const descriptor = {
      controls: {},
      map: {
        container: anchorId, 
        style: `mapbox://styles/mapbox/bright-v9`, //stylesheet location
        center: toLngLatArray(position), // starting position
        zoom: 15, // starting zoom,
        dragPan: true
      },
      sources: userPosition ? {
        userLocation: {
          type: `geojson`,
          data: createFeatureCollection(position)
        }
      }: undefined,
      layers: userPosition ? {
        userLocation: {
          id: `userLocation`,
          type: `circle`,
          source: `userLocation`,
          paint: {
            "circle-color": "#AAAAAA",
            "circle-radius": 15
          }
        }
      } : undefined,
      canvas: {
        style: {
          cursor: `grab`
        }
      }
    }

    return descriptor
  })
}

export default function main(sources, inputs) {
  const state$ = model({}, inputs)
  const vtree$ = view(state$)
  const mapDescriptor$ = mapview(state$)
    .publishReplay(1).refCount()

  // mapDescriptor$.map(x => {
  //     return x
  //   }).subscribe()

  return normalizeComponent({
    DOM: vtree$,
    MapJSON: mapDescriptor$.map(x => {
      return x
    })
  })
}