import {Observable as O} from 'rxjs'
import view from './view'
import mapView from './mapView'
import intent from './intent'
import model from './model'
import Immutable from 'immutable'

import {div, li, span} from '@cycle/DOM'

import AutocompleteInput from '../../../library/autocompleteInput'
import RadioInput from '../../../library/radioInput'
import FoursquareSuggestVenues from '../../../thirdParty/FoursquareSuggestVenues'

import VicinityScreen from './vicinity/main'
import AddressInput from './address/main'

import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import getModal from './getModal'

import {normalizeSink, normalizeSinkUndefined, normalizeComponent, spread, createProxy} from '../../../utils'
import {getVicinityFromGeolocation} from './utils'



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

const validVicinity = l => l && l.profile && l.profile.location && l.profile.location.vicinity
const validGeolocation = x => x

function getDefaultVicinity(sources, inputs) {

  const listing$ = inputs.listing$.take(1)
    //.debug(`vicinity listing$...`)
    .cache(1)

  const validVicinity$ = listing$
    .filter(validVicinity)
    .map(l => l.profile.location.vicinity)
    //.debug(`validVicinity$...`)

  const invalidVicinity$ = listing$
    .filter(x => !validVicinity(x))
    //.debug(`invalidVicinity$...`)
    .cache(1)

  const fallbackGeolocation$ = invalidVicinity$
    .switchMap(() => inputs.geolocation$)
    .cache(1)

  const fallbackGeolocationValid$ = fallbackGeolocation$
    .filter(validGeolocation)
    .map(getVicinityFromGeolocation)
    //.take(1)
    //.debug(`fallbackUserLocationValid$...`)

  const fallbackNewYork$ = fallbackGeolocation$
    .filter(x => !validGeolocation(x))
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
    .do(x => console.log(`fallbackNewYork$...`, x))


  //const vicinityScreen = Vicinity(sources, inputs)

  const defaultVicinity$ = O.merge(
    validVicinity$,
    fallbackGeolocationValid$,
    fallbackNewYork$
  )
  .map(x => {
    return x
  })
  .cache(1)

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

function contentComponent(sources, inputs) {

  const actions = intent(sources)

  const enrichedInputs = spread(inputs, {
    listing$: actions.listing$
  })

  const defaultVicinity$ = getDefaultVicinity(sources, enrichedInputs)

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
    props$: actions.listing$
      .map(listing => {
        return listing && listing.profile && listing.profile.location && listing.profile.location.mode
      })
      .map(mode => ({selected: mode}))
  })

  const toHTTPMimic$ = createProxy()
  const location$ = createProxy()
  const hideModal$ = createProxy()
  const vicinityFromScreen$ = createProxy()

  const state$ = model(actions, spread(enrichedInputs, {
    defaultVicinity$: defaultVicinity$,
    vicinityFromScreen$: vicinityFromScreen$,
    location$: location$,
    radio$: radioInput.selected$,
    hideModal$
  }))

  const modal$ = state$
    .map(x => {
      return x
    })
    .distinctUntilChanged(null, x => x.modal)
    .map(x => {
      return x
    })
    .map(state => getModal(sources, inputs, {modal: state.modal, listing: state.listing}))
    .cache(1)

  hideModal$.attach(normalizeSink(modal$, `close$`))
  vicinityFromScreen$.attach(normalizeSink(modal$, `done$`))

  const centerZoom$ = state$.map(x => x.listing.profile.location.vicinity.position)
  const venueAutocompleteInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => FoursquareSuggestVenues(sources, {props$: O.of({}), centerZoom$, input$: inputs.input$}),
    itemConfigs: venueItemConfigs,
    displayFunction: x => x.name,
    placeholder: `Start typing venue name here...`
  })

  const vicinity$ =  state$.map(s => {
    return s.listing.profile.location.vicinity
  })
  const addressInput = AddressInput(sources, spread(enrichedInputs, {
    props$: O.of({}),
    vicinity$ 
  }))

  location$.attach(O.merge(
    venueAutocompleteInput.selected$.map(x => ({type: `foursquare`, data: x})),
    addressInput.result$.skip(1)
  ))

  // //const vicinityScreen = VicinityScreen(sources, {parentVicinity$: vicinity$})
  // const vicinityScreenProxy = state$.map(state => {
  //   if (state.showVicinityScreen) return VicinityScreen(sources, {parentVicinity$: vicinity$})
  //   else return {}
  // })
  // .cache(1)

  // const vicinityScreen = {
  //   HTTP: normalizeSink(vicinityScreenProxy, `HTTP`),
  //   MapDOM: normalizeSink(vicinityScreenProxy, `MapDOM`),
  //   DOM: normalizeSinkUndefined(vicinityScreenProxy, `DOM`),
  //   result$: normalizeSink(vicinityScreenProxy, `result$`)//,
  //   //close$: normalizeSink(vicinityScreenProxy, `close$`)
  // }


  //closeVicinity$.imitate(vicinityScreen.close$)



  const vtree$ = view(state$, {
    radio: radioInput.DOM,
    venueAutocomplete: venueAutocompleteInput.DOM,
    addressInput: addressInput.DOM,
    modal: normalizeSink(modal$, `DOM`)
  })

  // const vtree$ = view(state$, {
  //   radio: O.of(div([`Hello`])),//radioInput.DOM,
  //   venueAutocomplete: O.of(div([`Hello`])),//venueAutocompleteInput.DOM,
  //   addressInput: O.of(div([`Hello`])),//addressInput.DOM,
  //   vicinityScreen: O.of(div([`Hello`]))//vicinityScreen.DOM
  // })



  const mapVTree$ = mapView(state$)

    // return {
    //   DOM: vtree$,
    //   HTTP: O.merge(venueAutocompleteInput.HTTP, addressInput.HTTP, vicinityScreen.HTTP, actions.toHTTP$),
    //   Router: O.merge(toNextScreen$, toPreviousScreen$),
    //   Global: venueAutocompleteInput.Global,
    //   Storage: O.never(),
    //   MapDOM: O.merge(vicinityScreen.MapDOM, mapVTree$),
    //   message$: state$
    //     .map(state => state.listing)
    //     .filter(listing => !!listing && listing.id)
    //     .map(listing => ({
    //       type: `listing`,
    //       data: listing
    //     }))
    // }

    return {
      DOM: vtree$,
      HTTP: O.merge(venueAutocompleteInput.HTTP, addressInput.HTTP, normalizeSink(modal$, `HTTP`), actions.toHTTP$),
      Global: venueAutocompleteInput.Global,
      MapDOM: O.merge(normalizeSink(modal$, `MapDOM`), mapVTree$),
      state$
    }

}

export default function main(sources, inputs) {
  // {contentComponent, create, nextRequiresListingId, previous, next}

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: false,
    previous: `description`,
    next: `time`
  })

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps
  }))

  const headingGenerator = (saving$) => normalizeComponent(Heading(sources, spread(
    inputs, {
      saving$
    })))

  const instruction = {
    DOM: O.of(div([`Location info`]))
  }

  const workflowStep = Step(sources, spread(inputs, {
    headingGenerator, 
    content, 
    instruction, 
    props$: O.of({
      panelClass: `create-location`
    })
  }))

  return workflowStep
}
