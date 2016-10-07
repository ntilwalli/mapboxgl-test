import {Observable as O} from 'rxjs'

import {div, input, select, option, h5, li, span} from '@cycle/dom'
import Immutable from 'immutable'
import VirtualDOM from 'virtual-dom'
import {combineObj, createProxy, spread} from '../../../../utils'
import {getCenterZoom, toLngLatArray, createFeatureCollection} from '../../../../util/map'
import FactualGeotagService from '../../../../thirdParty/FactualGeotagService'

const VNode = VirtualDOM.VNode

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

  // const regionService = FactualGeotagService({
  //   props$: O.of({category: `region from map location`}), 
  //   latLng$: mapMove$.map(x => x.center), 
  //   HTTP
  // })
  // const mapVicinity$ = regionService.result$
  //   .withLatestFrom(mapMove$, (region, position) => ({region, center: position.center}))

  const locationDescription$ = DOM.select(`.appLocationDescription`).events(`input`)
    .map(ev => ev.target.value)

  return {
    //mapVicinity$,
    //toHTTP$: regionService.HTTP,
    mapClick$,
    locationDescription$,
    dragEnd$,
    zoomEnd$
  }
}

function resetMapSettings(listing) {
  const mapSettings = listing.profile.mapSettings
  if (mapSettings) {
    mapSettings.center = undefined
    mapSettings.zoom = undefined
  }
}

function reducers(actions, inputs) {
  const {searchArea$} = inputs

  const searchAreaR = searchArea$.map(searchArea => state => {
    const listing = state.get(`listing`)
    listing.profile.searchArea = searchArea
    listing.profile.location.info = undefined
    listing.profile.mapSettings = undefined
    return state.set(`listing`, listing)
  })

  const mapClickR = actions.mapClick$.map(latLng => state => {
    const listing = state.get(`listing`)
    //const location = listing.profile.location
    const mapSettings = listing.profile.mapSettings

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

  const moveR = O.merge(actions.dragEnd$, actions.zoomEnd$).map(c => state => {
    const listing = state.get(`listing`)
    const mapSettings = listing.profile.mapSettings || {}
    mapSettings.center = c.center
    mapSettings.zoom = c.zoom
    listing.profile.mapSettings = mapSettings
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
        .scan((state, f) => f(state))
    })
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}


function view(state$, components) {
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
      const {location, mapSettings, searchArea} = listing.profile
      const anchorId = `chooseMapLocationMapAnchor`
      const markerLoc = location.info ? location.info.latLng : undefined
      let center = mapSettings && mapSettings.center ? 
        mapSettings.center : 
        markerLoc ?
          markerLoc :
          searchArea.center
      let zoom = mapSettings && mapSettings.zoom ? 
        mapSettings.zoom : 
        markerLoc ?
          17 :
          15

      const centerZoom = {center: toLngLatArray(center), zoom}
      const tile = mapSettings && mapSettings.tile ? mapSettings.tile : `mapbox://styles/mapbox/bright-v9`

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
