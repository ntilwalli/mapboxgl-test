import {Observable as O} from 'rxjs'

import {div, input, select, option, h5, li, span} from '@cycle/dom'
import Immutable from 'immutable'
import VirtualDOM from 'virtual-dom'
import {combineObj, createProxy, spread, toLatLngArray} from '../../../../utils'
import {getCenterZoom} from '../../../../util/map'
import FactualGeotagService from '../../../../thirdParty/FactualGeotagService'

const VNode = VirtualDOM.VNode

function intent(sources) {
    const {DOM, MapDOM, HTTP} = sources

  const mapClick$ = MapDOM.chooseMap(`chooseMapLocationMapAnchor`).select(`.chooseMapLocation`).events(`click`)
     .map(ev => ev.latlng)

  // const mapMove$ = MapDOM.chooseMap(`chooseMapLocationMapAnchor`).select(`.chooseMapLocation`).events(`moveend`)
  //   .do(() => {
  //     console.log(`mapMove`)
  //   })
  //   .map(getCenterZoom)
  //   .publishReplay(1).refCount()

  // const regionService = FactualGeotagService({
  //   props$: O.of({category: `region from map location`}), 
  //   latLng$: mapMove$.map(x => x.center), 
  //   HTTP
  // })
  // const mapVicinity$ = regionService.result$
  //   .withLatestFrom(mapMove$, (region, position) => ({region, center: position.center}))

  const locationDescription$ = sources.DOM.select(`.appLocationDescription`).events(`input`)
    .map(ev => ev.target.value)

  return {
    //mapVicinity$,
    //toHTTP$: regionService.HTTP,
    mapClick$,
    locationDescription$
  }
}

function reducers(actions, inputs) {
  const {searchArea$} = inputs

  const mapClickR = actions.mapClick$.map(latLng => state => {
    const listing = state.get(`listing`)
    //const location = listing.profile.location
    if (location.info) {
      listing.profile.location.info.latLng = latLng
    } else {
      listing.profile.location.info = {
        latLng,
        description: undefined
      }
    }

    return state.set(`listing`, JSON.parse(JSON.stringify(listing)))
  })

  const locationDescriptionR = actions.locationDescription$.map(desc => state => {
    const listing = state.get(`listing`)
    const location = listing.profile.location
    location.info.description = desc
    return state.set(`listing`, JSON.parse(JSON.stringify(listing)))

  })

  return O.merge(
    mapClickR,
    locationDescriptionR
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
      const centerZoom = location.info ? {center: toLatLngArray(location.info.latLng), zoom: 15} : {center: toLatLngArray(searchArea.center), zoom: 15}
      const properties = {attributes: {class: `chooseMapLocation`}, centerZoom, disablePanZoom: false, anchorId, mapOptions: {zoomControl: true}}
      const tile = mapSettings ? mapSettings.tile : `mapbox.streets`

      return new VNode(`map`, properties, [
        new VNode(`tileLayer`, { tile }),
        location.info ? new VNode(`marker`, { latLng: centerZoom.center, attributes: {id: `latLngMarker`}}, [
                // new VNode(`divIcon`, {
                //   options: {
                //     iconSize: 80,
                //     iconAnchor: [40, -10],
                //     html: `${event.core.name}`
                //   },
                //   attributes: {id: divIconId}
                // }, [], divIconId)
              ],
              `latLngMarker`) : null
      ])
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
    MapDOM: mapview(state$),
    HTTP: O.never(),//actions.toHTTP$,
    result$: state$.map(state => state.listing.profile.location.info).publishReplay(1).refCount()
  }
}
