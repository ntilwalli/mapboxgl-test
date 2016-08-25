import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeComponent, getCenterZoom} from '../../../utils'
import Immutable from 'immutable'
import VirtualDOM from 'virtual-dom'
const VNode = VirtualDOM.VNode

const MAP_ANCHOR_ID = `user-location-map`
const MAP_ROOT_CLASS = `location-map`

function intent(sources) {
  const {DOM, MapDOM} = sources
  const mapMove$ = MapDOM.chooseMap(MAP_ANCHOR_ID).select(`.${MAP_ROOT_CLASS}`).events(`moveend`)
     .map(getCenterZoom)
     .cache(1)

  return {
    mapMove$
  }
}

function model(actions, inputs) {
  return combineObj({
    authorization$: inputs.authorization$.take(1),
    geolocation$: inputs.geolocation$.take(1)
  })
  .map(inputs => {
    return inputs
  })
  .switchMap(initialState => {
    return O.never().startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
  })
  .map(x => x.toJS())
  .cache(1)
}

function view(state$) {
  return state$.map(state => {
    const {geolocation} = state
    const {position, region} = geolocation
    const {country, locality} = region.data
    const localState = region.data.region
    return div(`.user-location-map-component`, [
      div(`.region-display`, [
        `${locality}, ${localState}`
      ]),
      div(`#${MAP_ANCHOR_ID}`)
    ])
  })
}

function mapview(state$) {
  return state$.map(state => {
    const {geolocation} = state
    const {position, region} = geolocation
    const anchorId = MAP_ANCHOR_ID

    const centerZoom = {
      center: [position.lat, position.lng],
      zoom: 15//vicinity.position.zoom
    }

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
      new VNode('circleMarker', {latLng: centerZoom.center, radius: 6, attributes: {id: `someid`}})
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