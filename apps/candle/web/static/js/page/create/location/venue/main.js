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
      return li(
        `.venue-autocomplete-item.autocomplete-item-style.custom-autocomplete-input-style.${highlighted ? '.light-gray' : ''}`,
        {attrs: {'data-index': index}},
        [
          span(`.venue-name`, [suggestion.name]),
          span(`.venue-address`, [suggestion.address])
        ]
      )
    }
  }
}

function reducers(inputs) {
  const {selected$, vicinity$, mapSettings$} = inputs
  const selectedR = selected$.map(val => state => {
    return state.set(`info`, val)
  })

  const mapSettingsR = mapSettings$.skip(1).map(val => state => {
    return state.set(`mapSettings`, val)
  })

  const vicinityR = vicinity$.skip(1).map(val => state => {
    return state.set(`vicinity`, val)
  })

  return O.merge(
    selectedR,
    mapSettingsR,
    vicinityR
  )
}

function model(inputs) {
  const {props$, vicinity$, mapSettings$} = inputs
  const reducer$ = reducers(inputs)
  return combineObj({
      props$: props$.take(1),
      mapSettings$: mapSettings$.take(1),
      vicinity$: vicinity$.take(1)
    })
    .map(({props, vicinity, mapSettings}) => {
      return {
        info: props,
        mapSettings,
        vicinity
      }
    })
    .switchMap(initialState => {
      return reducer$
        .startWith(Immutable.Map(initialState))
        .scan((state, f) => f(state))
    })
    .map(x => x.toJS())
    .do(x => console.log(`venue state`, x))
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
              div(`.name`, [info.name]),
              div(`.address`, [info.address])
            ]),
            div(`#addEventMapAnchor`)
          ]) 
          : null
      ])
    })
}

function mapview(state$) {
  return state$
    .map(state => {
      const {info, vicinity, mapSettings} = state
      if (info) {
        //return null
        const anchorId = `addEventMapAnchor`
        const centerZoom = {
          center: toLatLngArray(info.latLng), 
          zoom: 15
        }

        const properties = {
          attributes: {
            class: `addEventMap`
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

  const {listing$} = inputs
  const mapSettings$ = listing$.map(x => x.profile.mapSettings)
    .distinctUntilChanged()
    .publishReplay(1).refCount()
  const vicinity$ = listing$.map(x => x.profile.location.vicinity)
    .distinctUntilChanged()
    .publishReplay(1).refCount()
  const info$ = listing$.map(x => x.profile.location.info)
    .distinctUntilChanged()
    .publishReplay(1).refCount()

  const venueAutocompleteInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => FoursquareSuggestVenues(sources, {props$: O.of({}), centerZoom$: vicinity$.map(v => v.position), input$: inputs.input$}),
    itemConfigs: venueItemConfigs,
    displayFunction: x => x.name,
    placeholder: `Start typing venue name here...`
  })

  const state$ = model({
    props$: info$,
    vicinity$,
    mapSettings$,
    selected$: venueAutocompleteInput.selected$
  })


  return {
    //DOM: O.of(div([`VenueInput`])),
    DOM: view(state$, {venue$: venueAutocompleteInput.DOM}),
    MapDOM: mapview(state$),
    Global: venueAutocompleteInput.Global,
    HTTP: venueAutocompleteInput.HTTP.map(x => {
      return x
    }),
    result$: state$.map(state => state.info).publishReplay(1).refCount()
  }
}
