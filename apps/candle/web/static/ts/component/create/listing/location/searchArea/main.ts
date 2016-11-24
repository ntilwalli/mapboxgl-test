import {Observable as O} from 'rxjs'
import {div, input, select, option, h5, li, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import {toLngLatArray, geoToLngLat} from '../../../../../mapUtils'

import FactualGeotagService from '../../../../../thirdParty/FactualGeotagService'
import {getState} from '../../../../../states'
import {createRegionAutocomplete} from '../../../../../library/regionAutocomplete'
import clone = require('clone')


function intent(sources, inputs) {
  const {DOM, MapJSON} = sources

  const dragEnd$ = MapJSON.select(`changeSearchAreaMapAnchor`).events(`dragend`)
    .observable

  const mapCenter$ = dragEnd$.map(x => {
    return x.target.getCenter()
  })
    .publish().refCount()

  const regionService = FactualGeotagService({props$: O.of({category: 'geotag from searchArea'}), lngLat$: mapCenter$, HTTP: sources.HTTP})
  const mapRegion$ = regionService.result$
    .withLatestFrom(mapCenter$, (geotag, center) => {
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
    mapRegion$,
    toHTTP$: regionService.HTTP
  }
}

function reducers(actions, inputs) {
  
  const searchAreaReducer$ = O.merge(
    actions.mapRegion$,
    inputs.inputRegion$
  )
    .map((v: any) => state => {
      const sa = state.get(`searchArea`, state)
      sa.center = v.center
      sa.region = v.region
      return state.set(`searchArea`, sa)
    })

  return O.merge(
    searchAreaReducer$
  )
}

function model(actions, inputs) {

  return combineObj({
      session$: inputs.session$.take(1),
      preferences$: inputs.preferences$.take(1),
      geoinfo$: inputs.Geolocation.cachedGeolocationWithGeotagAndCityState.take(1)
    })
    .switchMap((info: any) => {
      const {session, preferences, geoinfo} = info
      const {search_area} = session
      const {use_region, default_region} = preferences
      const {geolocation, city_state} = geoinfo
      const {type} = geolocation

      let init

      if (search_area) {
        init = clone(search_area)
      } else {
        if (use_region === `user` && type === `position`) {
          init = {
            region: {
              position: geoToLngLat(geolocation),
              city_state
            },
            radius: 50
          }
        } else {
          init = {
            region: clone(default_region),
            radius: 50
          }
        }
      }

      return reducers(actions, inputs)
        .startWith(<any> Immutable.Map(init))
        .scan((state, reducer: Function) => reducer(state))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`searchArea state...`, x))
    .publishReplay(1).refCount()
}

function renderSearchAreaModalBody(info) {
  const {state, components} = info
  const {region} = state
  const {city_state} = region
  const {city, state_abbr} = city_state
  return div(`.change-search-area-modal`, [
    components.autocomplete,
    div(`.map.sub-section`, [
      div(`.location-info-section`, [`${city}, ${state_abbr}`]),
      div(`#changeSearchAreaMapAnchor`)
    ])
  ])
}

function view({state$, components}) {
  return combineObj({state$, components$: combineObj(components)}).map(info => {
    return renderSearchAreaModalBody(info)
  })
}

function mapview(state$) {
  return state$.map(state => {
    const searchArea = state.searchArea
    const anchorId = `changeSearchAreaMapAnchor`

    const descriptor = {
      controls: {},
      map: {
        container: anchorId, 
        style: `mapbox://styles/mapbox/bright-v9`, //stylesheet location
        center: toLngLatArray(searchArea.region.position), // starting position
        zoom: 12, // starting zoom,
        dragPan: true
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

  const inputSearchArea$ = createProxy()
  const center$ = O.merge(
    session$.take(1).map(v => v.search_area.region.position),
    actions.mapRegion$.map(v => v.region.position),
    inputSearchArea$.map(x => x.center)
  )


  function getPreferredRegion$(inputs) {
    return combineObj({
      settings$: inputs.settings$,
      geoinfo$: inputs.Geolocation.cachedGeolocationWithGeotagAndCityState$
    }).map((info: any) => {
      const {settings, geoinfo} = info
      const {use_region} = settings
      const {geolocation, city_state} = geoinfo
      if (use_region === `user` && geolocation.type === `position`) {
        return {
          position: geoToLngLat(geolocation),
          city_state
        }
      } else {
        return clone(settings.default_region)
      }
    })
  }

  const state$ = model(actions, {inputSearchArea$, ...inputs})
  const regionAutocomplete = createRegionAutocomplete(sources, {
    ...inputs, 
    initial$: getPreferredRegion$(inputs)
  })

  const out = {
    DOM: view({state$, components: {autocomplete$: regionAutocomplete.DOM}}),
    MapJSON: mapview(state$),
    HTTP: O.merge(regionAutocomplete.HTTP, actions.toHTTP$),
    output$: state$.map(x => x.searchArea)
  }

  return out
}