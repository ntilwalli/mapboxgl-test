import {Observable as O} from 'rxjs'
import view from './view'
import intent from './intent'
import model from './model'
import Immutable = require('immutable')

import {div, li, span} from '@cycle/dom'

import AutocompleteInput from '../../../library/autocompleteInput'
import RadioInput from '../../../library/radioInput'
import FoursquareSuggestVenues from '../../../thirdParty/FoursquareSuggestVenues'

import SearchAreaScreen from './searchArea/main'
import AddressInput from './address/main'
import VenueInput from './venue/main'
import MapInput from './map/main'

import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import getModal from './getModal'

import {normalizeSink, normalizeSinkUndefined, normalizeComponent, spread, createProxy} from '../../../utils'
import {getSearchAreaFromGeolocation} from './utils'

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

const validGeolocation = x => x.user
const invalidGeolocation = x => !x.user

function getDefaultSearchArea(sources, inputs) {

  return inputs.geolocation$
    .map(getSearchAreaFromGeolocation)
    .publishReplay(1).refCount()

}

function contentComponent(sources, inputs) {

  const actions = intent(sources)

  const defaultSearchArea$ = getDefaultSearchArea(sources, inputs)


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
  const searchAreaFromScreen$ = createProxy()

  const state$ = model(actions, spread(inputs, {
    searchAreaFromScreen$: searchAreaFromScreen$,
    location$: location$,
    radio$: radioInput.selected$,
    hideModal$,
    listing$: actions.listing$
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
    .publishReplay(1).refCount()

  hideModal$.attach(normalizeSink(modal$, `close$`))
  searchAreaFromScreen$.attach(normalizeSink(modal$, `done$`))

  const listing$ = state$.map(x => x.listing)
  const inputComponent$ = state$
    .distinctUntilChanged(null, x => x.listing.profile.location.mode)
    .map(state => {
      const mode = state.listing.profile.location.mode
      if (mode === `address`) {
        return AddressInput(sources, spread(inputs, {
          props$: O.of({}),
          listing$
        }))
      } else if (mode === `venue`) {
        return VenueInput(sources, spread(inputs, {
          props$: O.of({}),
          searchArea$: searchAreaFromScreen$,
          listing$: listing$
            .publish().refCount()
        }))
      } else if (mode === `map`) {
        return MapInput(sources, spread(inputs, {
          listing$: listing$,
          searchArea$: searchAreaFromScreen$
            //.do(x => console.log(`MapInput got new listing`, x))
            .publish().refCount()
        }))
      }
    })
    .map(normalizeComponent)
    .publishReplay(1).refCount()

  //location$.attach(normalizeSink(inputComponent$, `result$`))
  location$.attach(inputComponent$.switchMap(x => x.result$.skip(1)))

  const vtree$ = view(state$, {
    radio: radioInput.DOM,
    inputComponent: normalizeSink(inputComponent$, `DOM`),
    modal: normalizeSink(modal$, `DOM`)
  })



  return {
    DOM: vtree$,
    HTTP: O.merge(normalizeSink(inputComponent$, `HTTP`), normalizeSink(modal$, `HTTP`)),
    Global: normalizeSink(inputComponent$, `Global`),
    MapJSON: O.merge(normalizeSink(modal$, `MapJSON`), normalizeSink(inputComponent$, `MapJSON`)),
    state$: state$.map(x => {
      return x
    })
  }

}

export default function main(sources, inputs) {

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: true,
    previous: `description`,
    next: listing => {
      const profile = listing.profile
      const location = profile.location
      if (location.mode === `address`) {
        return `confirmAddressLocation`
      } else {
        if (listing.type === `recurring`) {
          return `recurrence`
        } else {
          return `time`
        }
      }
    }
  })

  const listing$ = createProxy()

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps,
    listing$
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

  listing$.attach(workflowStep.listing$)


  return workflowStep
}