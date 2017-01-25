import {Observable as O} from 'rxjs'
import {li, span, strong, em} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks} from '../utils'
import FoursquareSuggestVenues from '../thirdParty/FoursquareSuggestVenues'
import AutocompleteInput from '../library/bootstrapAutocompleteInputGated'
import {isValid, getVenueName, getVenueAddress} from '../helpers/donde'


function toFoursquareVenueResults(results) {
  return results.map(result => ({
    type: `venue`,
    source: `foursquare`,
    data: result,
    lng_lat: {lat: result.location.lat, lng: result.location.lng}
  })).filter(isValid)
}

export function createVenueAutocomplete(sources, inputs) {
  const {search_area$, props$, highlight_error$} = inputs

  const itemConfigs = {
    venue: {
      selectable: true,
      renderer: (suggestion, index, highlighted) => {
        return li(
          `.dropdown-item${highlighted ? '.highlight' : ''}`,
          {attrs: {'data-index': index}},
          [
            em(`.venue-name.mr-4`, [getVenueName(suggestion)]),
            getVenueAddress(suggestion)
          ]
        )
      }
    }
  }

  const results$ = createProxy()
  const autocompleteInput = AutocompleteInput(sources, results$, O.of(''), highlight_error$, {
    itemConfigs,
    displayFunction: suggestion => getVenueName(suggestion),
    placeholder: `Type venue name here...`,
    styleClass: `.autocomplete-input`,
    name: 'region',
    emptyIsError: false
  })

  const suggestionComponent = FoursquareSuggestVenues(sources, {
    //...inputs,
    props$: props$, 
    search_area$: search_area$.distinctUntilChanged()
      .map(x => {
        return x
      }),
    input$: autocompleteInput.input$
  })

  results$.attach(suggestionComponent.results$.map(toFoursquareVenueResults))

  const merged = mergeSinks(autocompleteInput, suggestionComponent)
  const out = {
    //...merged,
    DOM: autocompleteInput.DOM,
    HTTP: suggestionComponent.HTTP.publishReplay(1).refCount(),
    Global: autocompleteInput.Global,
    output$: autocompleteInput.selected$.publish().refCount(),
    waiting$: suggestionComponent.waiting$
  }

  //out.output$.subscribe(x => console.log(`out`, x))

  return out
}