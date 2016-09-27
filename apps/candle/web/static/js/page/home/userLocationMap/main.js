import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeComponent, 
  getCenterZoom, getVicinityFromGeolocation, 
  getNormalizedRegion, toLatLngArray} from '../../../utils'
import Immutable from 'immutable'
import VirtualDOM from 'virtual-dom'

const VNode = VirtualDOM.VNode

const MAP_ANCHOR_ID = `user-location-map`
const MAP_ROOT_CLASS = `location-map`

function intent(sources) {
  const {DOM, MapDOM} = sources
  const mapMove$ = MapDOM.chooseMap(MAP_ANCHOR_ID).select(`.${MAP_ROOT_CLASS}`).events(`moveend`)
     .map(getCenterZoom)
     .publishReplay(1).refCount()

  return {
    mapMove$
  }
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


    const centerZoom = {
      center: [position.lat, position.lng],
      zoom: 15//vicinity.position.zoom
    }

    const userPosition = user && user.position

    const properties = {
      attributes: {
        class: MAP_ROOT_CLASS
      },
      centerZoom,
      disablePanZoom: false,
      anchorId,
      mapOptions: {zoomControl: true}
    }

    const tile = `mapbox.streets`

    return new VNode(`map`, properties, [
      new VNode(`tileLayer`, { tile }),
      userPosition ? new VNode('circleMarker', {latLng: toLatLngArray(userPosition), radius: 6, attributes: {id: `someid`}}) : null
    ])
  })
}

export default function main(sources, inputs) {
  const state$ = model({}, inputs)
  const vtree$ = view(state$)
  const mapvtree$ = mapview(state$)
  return normalizeComponent({
    DOM: vtree$,
    MapDOM: mapvtree$
  })
}