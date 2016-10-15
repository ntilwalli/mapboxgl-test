import {Observable as O} from 'rxjs'

import {div, input, select, option, h5, li, span} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy, spread} from '../../../../utils'
import {toLngLatArray, createFeatureCollection} from '../../../../util/map'

import AutocompleteInput from '../../../../library/autocompleteInput'
import FoursquareSuggestVenues from '../../../../thirdParty/FoursquareSuggestVenues'

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
  const {selected$, searchArea$} = inputs
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
      const mapSettings = listing.profile.map_settings
      const searchArea = listing.profile.search_area
      return {
        info: location.info,
        mapSettings,
        searchArea
      }
    })
    .switchMap(initialState => {
      return reducer$
        .startWith(Immutable.Map(initialState))
        .scan((state, f: Function) => f(state))
    })
    .map(x => (<any> x).toJS())
    //.do(x => console.log(`venue state`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map((stateInfo: any) => {
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
  return state$.map(state => {
    const {info, search_area, map_settings} = state

    if (info) {
      const anchorId = `addSelectVenueMapAnchor`

      const descriptor = {
        controls: {},
        map: {
          container: anchorId, 
          style: `mapbox://styles/mapbox/bright-v9`, //stylesheet location
          center: toLngLatArray(info.data.latLng), // starting position
          zoom: 15, // starting zoom,
          dragPan: true
        },
        sources: {
          venue: {
            type: `geojson`,
            data: createFeatureCollection(info.data.latLng, {
              title: info.data.name,
              icon: `marker`
            })
          }
        },
        layers: {
          venue: {
            id: `venue`,
            type: `symbol`,
            source: `venue`,
            layout: {
                "icon-image": `{icon}-15`,
                "icon-size": 1.5,
                // "text-field": `{title}`,
                "text-font": [`Open Sans Semibold`, `Arial Unicode MS Bold`],
                "text-offset": [0, 0.6],
                "text-anchor": `top`
            }
          }
        },
        canvas: {
          style: {
            cursor: `grab`
          }
        }
      }

      return descriptor
    } else {
      return undefined
    }
  }).filter(x => !!x)
}

export default function main(sources, inputs) {

  const {listing$, searchArea$} = inputs

  const centerZoom$ = O.merge(
    listing$.take(1).map(x => x.profile.search_area),
    searchArea$
  ).map((v: any) => ({center: v.center, zoom: 8}))
  //.do(x => console.log(`search area:`, x))

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
    MapJSON: mapview(state$),
    Global: venueAutocompleteInput.Global,
    HTTP: venueAutocompleteInput.HTTP,
    result$: state$.map(state => state.info).publishReplay(1).refCount()
  }
}
