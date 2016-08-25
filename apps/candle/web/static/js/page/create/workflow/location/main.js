import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import view from './view'
import mapView from './mapView'
import intent from './intent'
import model from './model'
import Immutable from 'immutable'

import {div, li, span} from '@cycle/DOM'
import combineObj from '../../../combineObj'

import AutocompleteInput from '../../../general/autocompleteInput'
import RadioInput from '../../../general/radioInput'
import FoursquareSuggestVenues from '../../../service/FoursquareSuggestVenues'
import VicinityScreen from './vicinity/main'


import AddressInput from './address/main'

import {noopListener, normalizeSink, normalizeSinkUndefined} from '../../../utils'
import {getVicinityFromUserLocation} from './utils'

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

// Vicinity options:
// - Current location
// - Selected city center
// - Map center when manually moved

// Map center options:
// - Current location
// - Selected city center
// (Map center)

// mode: `map`
// can move map: yes

// mode: `venue`
// can move map: yes

// mode: address (autocomplete)
// can move map: yes

// mode: address (custom)
// can move map: no


// Blank location in listing
// Vicinity: userLocation || New York (controls)
// Map center: Vicinity
// Autocomplete: Vicinity
//

const validVicinity = l => l && l.location && l.location.vicinity
const validUserLocation = x => x

function getDefaultVicinity(sources, inputs, actions) {

  const listing$ = inputs.listing$.take(1)
    //.debug(`vicinity listing$...`)
    .remember()

  const validVicinity$ = listing$
    .filter(validVicinity)
    .map(l => l.location.vicinity)
    //.debug(`validVicinity$...`)

  const invalidVicinity$ = listing$
    .filter(x => !validVicinity(x))
    //.debug(`invalidVicinity$...`)
    .remember()

  const fallbackUserLocation$ = invalidVicinity$
    .map(() => inputs.userLocation$)
    .flatten()
    .remember()

  const fallbackUserLocationValid$ = fallbackUserLocation$
    .filter(validUserLocation)
    .map(getVicinityFromUserLocation)
    //.take(1)
    //.debug(`fallbackUserLocationValid$...`)

  const fallbackNewYork$ = fallbackUserLocation$
    .filter(x => !validUserLocation(x))
    .map(() => ({
      state: `NY`,
      city: `New York`,
      country: `US`,
      position: {
        center: {
          lat: 40.7128,
          lng: -74.0059
        },
        zoom: 8
      }
    }))
    .debug(`fallbackNewYork$...`)


  //const vicinityScreen = Vicinity(sources, inputs)

  const defaultVicinity$ = xs.merge(
    validVicinity$,
    fallbackUserLocationValid$,
    fallbackNewYork$
  )

  return defaultVicinity$

}




// Now listing no longer has blank location
//
// Filled location in listing
//
// Vicinity changed manually
// Vicinity: selected
// Map center: Vicinity
// Autocomplete: Vicinity
//
// Map center manually moved
// Vicinity: Map center |> geotag
// Map center: selected
// Autocomplete: Map center


// 1a) Map center when manually moved |> Geotag
// 1b) When map not manually moved
// 2) City center when manually selected
// 3) Current location |> Geotag


// If `map`-mode
//
// Vicinity is:
// - init : location.mapSettings || location.vicinity || userLocation

export default function main(sources, inputs) {

  const actions = intent(sources)

  const defaultVicinity$ = getDefaultVicinity(sources, inputs, actions).remember()

  //defaultVicinity$.addListener(noopListener)

  const radioInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `Venue`,
      value: `venue`
    },{
      displayValue: `Address`,
      value: `address`
    }, {
      displayValue: `Point on map`,
      value: `map`
    }],
    props$: inputs.listing$
      .map(listing => {

        return listing && listing.location && listing.location.mode
      })
      .map(mode => ({selected: mode}))
  })


  //radioInput.selected$.debug().addListener(noopListener)
  //const state$ = model(actions, {autocomplete$: autocompleteInput.selected$, radio$: })

  const toHTTPMimic$ = xs.create()
  const location$ = xs.create()
  const vicinityFromScreen$ = xs.create()
  //const closeVicinity$ = xs.create()

  const state$ = model(actions, {
    ...inputs,
    //closeVicinity$,
    defaultVicinity$,
    vicinityFromScreen$,
    location$,
    radio$: radioInput.selected$
  })

  // const autocompleteInput = AutocompleteInput(sources,
  //   suggester,
  //   itemConfigs
  // )

  const centerZoom$ = state$.map(x => x.listing.location.vicinity.position)
  const venueAutocompleteInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => FoursquareSuggestVenues(sources, {props$: xs.of({}), centerZoom$, input$: inputs.input$}),
    itemConfigs: venueItemConfigs,
    displayFunction: x => x.name,
    placeholder: `Start typing venue name here...`
  })

  const vicinity$ =  state$.map(s => s.listing.location.vicinity)
  const addressInput = AddressInput(sources, {props$: xs.of({}), vicinity$, ...inputs})

  location$.imitate(xs.merge(
    venueAutocompleteInput.selected$.map(x => ({type: `foursquare`, data: x})),
    addressInput.result$.drop(1)
  ))



  //const vicinityScreen = VicinityScreen(sources, {parentVicinity$: vicinity$})
  const vicinityScreenProxy = state$.map(state => {
    if (state.showVicinityScreen) return VicinityScreen(sources, {parentVicinity$: vicinity$})
    else return {}
  })
  .remember()

  const vicinityScreen = {
    HTTP: normalizeSink(vicinityScreenProxy, `HTTP`),
    MapDOM: normalizeSink(vicinityScreenProxy, `MapDOM`),
    DOM: normalizeSinkUndefined(vicinityScreenProxy, `DOM`),
    result$: normalizeSink(vicinityScreenProxy, `result$`)//,
    //close$: normalizeSink(vicinityScreenProxy, `close$`)
  }

  vicinityFromScreen$.imitate(vicinityScreen.result$.debug(`from vicinity screen`))
  //closeVicinity$.imitate(vicinityScreen.close$)



  const vtree$ = view({state$, components: {
    radio: radioInput.DOM,
    venueAutocomplete: venueAutocompleteInput.DOM,
    addressInput: addressInput.DOM,
    vicinityScreen: vicinityScreen.DOM
  }})


  const toNextScreen$ = actions.next$
    .map(() => state$.filter(state => state.isValid)
      .map(state => state.listing)
      .map(listing => {
        const mode = listing.location.mode
        if (mode === `venue` || mode === `map`) {
          return {
            pathname: `/create/${listing.id}/time`,
            action: `PUSH`,
            state: listing
          }
        } else if (mode === `address`) {
          return {
            pathname: `/create/${listing.id}/confirmAddressLocation`,
            action: `PUSH`,
            state: listing
          }
        }
      })
    ).flatten()

  const toPreviousScreen$ = actions.back$
    .map(() => state$.map(state => {
        return {
          pathname: `/create/${state.listing.id}/name`,
          action: `PUSH`,
          state: state.listing
        }

    }))
    .flatten()
    .debug(`location back$`)


  const mapVTree$ = mapView(state$)

    return {
      DOM: vtree$,
      HTTP: xs.merge(venueAutocompleteInput.HTTP, addressInput.HTTP, vicinityScreen.HTTP, actions.toHTTP$),
      Router: xs.merge(toNextScreen$, toPreviousScreen$),
      Global: venueAutocompleteInput.Global,
      Storage: xs.never(),
      MapDOM: xs.merge(vicinityScreen.MapDOM, mapVTree$),
      message$: state$
        .map(state => state.listing)
        .filter(listing => !!listing && listing.id)
        .map(listing => ({
          type: `listing`,
          data: listing
        }))
    }

}
