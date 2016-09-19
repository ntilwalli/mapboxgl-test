import {Observable as O} from 'rxjs'

import {div, input, select, option, h5, li, span} from '@cycle/dom'
import Immutable from 'immutable'
import VirtualDOM from 'virtual-dom'
import {combineObj, createProxy, spread, toLatLngArray} from '../../../../utils'

import AutocompleteInput from '../../../../library/autocompleteInput'
import FoursquareSuggestVenues from '../../../../thirdParty/FoursquareSuggestVenues'

const VNode = VirtualDOM.VNode

const venueItemConfigs = {
  default: {
    selectable: true,
    renderer: (suggestion, index, highlighted) => {
      const info = suggestion.data
      return li(
        `.venue-autocomplete-item.autocomplete-item-style.custom-autocomplete-input-style.${highlighted ? '.light-gray' : ''}`,
        {attrs: {'data-index': index}},
        [
          span(`.venue-name`, [info.name]),
          span(`.venue-address`, [info.address])
        ]
      )
    }
  }
}

function reducers(inputs) {
  const {selected$, searchArea$, mapSettings$} = inputs
  const selectedR = selected$.map(val => state => {
    return state.set(`info`, val)
  })

  const searchAreaR = searchArea$.map(val => state => {
    return state.set(`searchArea`, val)
  })

  return O.merge(
    selectedR,
    searchAreaR
  )
}

function model(inputs) {
  const {listing$} = inputs
  const reducer$ = reducers(inputs)
  return listing$
    .take(1)
    .map(listing => {
      const location = listing.profile.location
      const mapSettings = listing.profile.mapSettings
      const searchArea = listing.searchArea
      return {
        info: location.info,
        mapSettings,
        searchArea
      }
    })
    .switchMap(initialState => {
      return reducer$
        .startWith(Immutable.Map(initialState))
        .scan((state, f) => f(state))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`venue state`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map(stateInfo => {
      const {state, components} = stateInfo
      const {venue} = components
      const {info} = state
      return div([
        venue,
        info ? //null
          div(`.map.sub-section`, [
            div(`.location-info-section`, [
              div(`.name`, [info.data.name]),
              div(`.address`, [info.data.address])
            ]),
            div(`#addSelectVenueMapAnchor`)
          ]) 
          : null
      ])
    })
}

function mapview(state$) {
  return state$
    .map(state => {
      const {info, searchArea, mapSettings} = state
      if (info) {
        //return null
        const anchorId = `addSelectVenueMapAnchor`
        const centerZoom = {
          center: toLatLngArray(info.data.latLng), 
          zoom: 15
        }

        const properties = {
          attributes: {
            class: `selectVenueMap`
          }, 
          centerZoom, 
          disablePanZoom: false, 
          anchorId, 
          mapOptions: {
            zoomControl: true
          }
        }

        const tile = mapSettings ? mapSettings.tile : `mapbox.streets`

        return new VNode(`map`, properties, [
          new VNode(`tileLayer`, { tile }),
          info ? new VNode(`marker`, { latLng: centerZoom.center, attributes: {id: `latLngMarker`}}, [
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
      } else {
        return null
      }
    })
    .filter(x => !!x)
}

export default function main(sources, inputs) {

  const {listing$, searchArea$} = inputs

  const centerZoom$ = O.merge(
    listing$.take(1).map(x => x.profile.searchArea),
    searchArea$
  ).map(v => ({center: v.center, zoom: 8}))
  .do(x => console.log(`search area:`, x))

  const venueAutocompleteInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => FoursquareSuggestVenues(sources, {props$: O.of({}), centerZoom$, input$: inputs.input$}),
    itemConfigs: venueItemConfigs,
    displayFunction: x => x.data.name,
    placeholder: `Start typing venue name here...`
  })

  const state$ = model({
    listing$,
    searchArea$,
    selected$: venueAutocompleteInput.selected$
  })


  return {
    DOM: view(state$, {venue$: venueAutocompleteInput.DOM}),
    MapDOM: mapview(state$),
    Global: venueAutocompleteInput.Global,
    HTTP: venueAutocompleteInput.HTTP.map(x => {
      return x
    }),
    result$: state$.map(state => state.info).publishReplay(1).refCount()
  }
}
