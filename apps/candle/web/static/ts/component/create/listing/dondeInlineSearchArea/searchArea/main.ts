import {Observable as O} from 'rxjs'
import {div, input, select, option, h5, li, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import {toLngLatArray, geoToLngLat} from '../../../../../mapUtils'

import FactualGeotagService from '../../../../../thirdParty/FactualGeotagService'
import {getState} from '../../../../../states'
import {createRegionAutocomplete} from '../../../../../library/bootstrapRegionAutocomplete'
import clone = require('clone')


function intent(sources, inputs) {
  const {DOM, MapJSON} = sources

  const drag_end$ = MapJSON.select(`changeSearchAreaMapAnchor`).events(`dragend`)
    .observable

  const map_center$ = drag_end$.map(x => {
    return x.target.getCenter()
  })
    .publish().refCount()

  const region_service = FactualGeotagService({
    props$: O.of({category: 'geotag from searchArea'}), 
    lngLat$: map_center$, 
    HTTP: sources.HTTP
  })
  
  const map_region$ = region_service.result$
    .withLatestFrom(map_center$, (geotag, center) => {
      return {
        region: {
          position: center,
          geotag,
          city_state: {
            city: geotag.locality.name, 
            state_abbr: getState(geotag.region.name)
          }
        }
      }
    })
    .publish().refCount()

  return {
    radius$: DOM.select(`.appRadiusInput`).events(`change`).map(ev => ev.target.value),
    map_region$,
    to_http$: region_service.HTTP
  }
}

function reducers(actions, inputs) {
  
  const region_r = inputs.input_region$
    .map((region: any) => (state: any) => {
      return state.set(`region`, region)
    })

  const radius_r = actions.radius$.map(radius => state => {
    return state.set(`radius`, radius)
  })

  return O.merge(
    region_r, radius_r
  )
}

function model(actions, inputs) {

  return combineObj({
      props$: inputs.props$
    })
    .switchMap((info: any) => {
      return reducers(actions, inputs)
        .startWith(<any> Immutable.Map(clone(info.props)))
        .scan((state, reducer: Function) => reducer(state))
    })
    .map((x: any) => x.toJS())
    .do(x => console.log(`searchArea state...`, x))
    .publishReplay(1).refCount()
}

function renderSearchAreaModalBody(info) {
  const {state, components} = info
  const {region} = state
  const {city_state} = region
  const {city, state_abbr} = city_state
  return div(`.change-search-area-modal.row`, [
    //div(`.autocomplete`, [
      div('.col-12', [
        components.autocomplete,
        div(`.map`, [
          div(`.location-info-section`, [`${city}, ${state_abbr}`]),
          div(`#changeSearchAreaMapAnchor`)
        ])
      ])
    //]),
  ])
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)}).map(info => {
    return renderSearchAreaModalBody(info)
  })
}

function mapview(state$) {
  return state$.map(state => {
    const searchArea = state
    const anchorId = `changeSearchAreaMapAnchor`

    const descriptor = {
      controls: {},
      map: {
        container: anchorId, 
        style: `mapbox://styles/mapbox/bright-v9`, //stylesheet location
        center: toLngLatArray(searchArea.region.position), // starting position
        zoom: 12, // starting zoom,
        dragPan: false,
        scrollZoom: false
      },
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

  const {session$} = inputs
  const actions = intent(sources, inputs)

  //const inputSearchArea$ = createProxy()
  const input_region$ = createProxy()

  const state$ = model(actions, {input_region$, ...inputs})
  const region_autocomplete = createRegionAutocomplete(sources, {
    ...inputs, 
    props$: state$
      .map((state: any) => {
        console.log(state)
        return state.region
      })
      .distinctUntilChanged((x: any, y: any) => x.position.lat == y.position.lat && x.position.lng === y.position.lng)
  })

  input_region$.attach(region_autocomplete.output$)

  const components = {
    autocomplete$: region_autocomplete.DOM
  }

  const vtree$ = view(state$, components)

  const out = {
    DOM: vtree$,
    MapJSON: mapview(state$).do(x => console.log(`mapjson`, x)).publish().refCount(),
    HTTP: O.merge(region_autocomplete.HTTP, actions.to_http$).publish().refCount(),
    output$: state$
  }

  //out.HTTP.subscribe(x => console.log(`HTTP`, x))

  return out
}