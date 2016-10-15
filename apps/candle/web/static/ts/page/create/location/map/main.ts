import {Observable as O} from 'rxjs'

import {div, input, select, option, h5, li, span} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy, spread} from '../../../../utils'
import {getCenterZoom, toLngLatArray, createFeatureCollection} from '../../../../util/map'

function intent(sources) {
    const {DOM, MapJSON, HTTP} = sources

  const mapClick$ = MapJSON.select(`chooseMapLocationMapAnchor`).events(`click`).observable
     .map(ev => ev.lngLat)

  const dragEnd$ = MapJSON.select(`chooseMapLocationMapAnchor`).events(`dragend`)
    .observable
    .map(ev => {
      const t = ev.target
      return {center: t.getCenter(), zoom: t.getZoom()}
    })
    .publishReplay().refCount()

  const zoomEnd$ = MapJSON.select(`chooseMapLocationMapAnchor`).events(`zoomend`)
    .observable
    .map(ev => {
      const t = ev.target
      return {center: t.getCenter(), zoom: t.getZoom()}
    })
    .publishReplay().refCount()

  const locationDescription$ = DOM.select(`.appLocationDescription`).events(`input`)
    .map(ev => ev.target.value)

  return {
    mapClick$,
    locationDescription$,
    dragEnd$,
    zoomEnd$
  }
}

function resetMapSettings(listing) {
  const map_settings = listing.profile.map_settings
  if (map_settings) {
    map_settings.center = undefined
    map_settings.zoom = undefined
  }
}

function reducers(actions, inputs) {
  const {searchArea$} = inputs

  const searchAreaR = searchArea$.map(search_area => state => {
    const listing = state.get(`listing`)
    listing.profile.search_area = search_area
    listing.profile.location.info = undefined
    listing.profile.map_settings = undefined
    return state.set(`listing`, listing)
  })

  const mapClickR = actions.mapClick$.map(latLng => state => {
    const listing = state.get(`listing`)
    const location = listing.profile.location

    if (location.info) {
      listing.profile.location.info.latLng = latLng
    } else {
      listing.profile.location.info = {
        latLng,
        description: undefined
      }
    }

    //resetMapSettings(listing)

    return state.set(`listing`, JSON.parse(JSON.stringify(listing)))
  })

  const moveR = O.merge(actions.dragEnd$, actions.zoomEnd$).map((c: any) => state => {
    const listing = state.get(`listing`)
    const map_settings = listing.profile.map_settings || {}
    map_settings.center = c.center
    map_settings.zoom = c.zoom
    listing.profile.map_settings = map_settings
    return state.set(`listing`, JSON.parse(JSON.stringify(listing)))
  })

  const locationDescriptionR = actions.locationDescription$.map(desc => state => {
    const listing = state.get(`listing`)
    const location = listing.profile.location
    location.info.description = desc
    return state.set(`listing`, JSON.parse(JSON.stringify(listing)))

  })

  return O.merge(
    searchAreaR, 
    mapClickR,
    locationDescriptionR,
    moveR
  )
}

function model(actions, inputs) {
  const {listing$} = inputs
  const reducer$ = reducers(actions, inputs)
  return listing$
    .take(1)
    .map(listing => {
      // listing.profile.location.info = {
      //   latLng: undefined
      // }
      return {
        listing
      }
    })
    .switchMap(initialState => {
      return reducer$
        .startWith(Immutable.Map(initialState))
        .scan((state, f: Function) => f(state))
    })
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()
}


function view(state$) {
  return state$
    .map(state => {
      const {listing} = state
      const location = listing.profile.location
      return div(`.map.sub-section`, [
        location.info ? div(`.location-info-section`, [
          div(`.latitude-section`, [
            span(`.heading`, [`Latitude: `]),
            span([`${location.info.latLng.lat}`])
          ]),
          div(`.longitude-section`, [
            span(`.heading`, [`Longitude: `]),
            span([`${location.info.latLng.lng}`])
          ])
        ]) : div(`.location-info-section`, [`Click map to select location`]),
        div(`#chooseMapLocationMapAnchor`),
        location.info ? div(`.location-description.sub-section`, [
          div(`.heading`, [h5([`Describe the location (optional)`])]),
          div(`.content`, [
            input(`.appLocationDescription`, {props: {type: `text`, value: location.info.description || ``}})
          ])
        ]) : null
      ])
    })
}

function mapview(state$) {
  return state$
    .map(state => {
      const listing = state.listing
      const {location, map_settings, search_area} = listing.profile
      const anchorId = `chooseMapLocationMapAnchor`
      const markerLoc = location.info ? location.info.latLng : undefined
      let center = map_settings && map_settings.center ? 
        map_settings.center : 
        markerLoc ?
          markerLoc :
          search_area.center
      let zoom = map_settings && map_settings.zoom ? 
        map_settings.zoom : 
        markerLoc ?
          17 :
          15

      const centerZoom = {center: toLngLatArray(center), zoom}
      const tile = map_settings && map_settings.tile ? map_settings.tile : `mapbox://styles/mapbox/bright-v9`

      const descriptor = {
        controls: {},
        map: {
          container: anchorId, 
          style: tile, //stylesheet location
          center: centerZoom.center, // starting position
          zoom: centerZoom.zoom, // starting zoom,
          dragPan: true
        },
        sources: markerLoc ? {
          marker: {
            type: `geojson`,
            data: createFeatureCollection(location.info.latLng, {
              icon: `marker`
            })
          }
        } : undefined,
        layers: markerLoc ? {
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

  const {listing$, searchArea$} = inputs

  const actions = intent(sources)

  const state$ = model(actions, {
    listing$,
    searchArea$
  })

  return {
    DOM: view(state$),
    MapJSON: mapview(state$),
    HTTP: O.never(),//actions.toHTTP$,
    result$: state$.map(state => state.listing.profile.location.info).publishReplay(1).refCount()
  }
}
