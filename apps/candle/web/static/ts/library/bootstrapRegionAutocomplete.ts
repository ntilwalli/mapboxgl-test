import {Observable as O} from 'rxjs'
import {li, span} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, normalizeArcGISSingleLineToParts} from '../utils'
import ArcGISSuggest from '../thirdParty/ArcGISSuggest'
import ArcGISGetMagicKey from '../thirdParty/ArcGISGetMagicKey'
import AutocompleteInput from '../library/bootstrapAutocompleteInput'


export function createRegionAutocomplete(sources, inputs) {
  const center$ = inputs.props$
    // .do(x => console.log(`region autocomplete center`, x))
    .pluck(`position`)
    .publishReplay(1).refCount()

  const itemConfigs = {
    default: {
      selectable: true,
      renderer: (suggestion, index, highlighted) => {
        return li(
          `.dropdown-item${highlighted ? '.highlight' : ''}`,
          {attrs: {'data-index': index}},
          [
            span(`.populated-place-info`, [suggestion.normalizedName])
          ]
        )
      }
    }
  }

  const results$ = createProxy()
  const autocompleteInput = AutocompleteInput(sources, results$, O.of(''), {
    itemConfigs,
    displayFunction: x => x.normalizedName,
    placeholder: `Type city/state here...`,
    styleClass: `.autocomplete-input`,
    name: 'venue'
  })

  const suggestionComponent = ArcGISSuggest(sources, {
    props$: combineObj({
      category: O.of('Populated+Place')
    }),
    center$: center$.distinctUntilChanged(),
    input$: autocompleteInput.input$//.do(x => console.log(`input`, x))
  })

  results$.attach(suggestionComponent.results$)

  const magicKeyComponent = ArcGISGetMagicKey(sources, {props$: O.of({category: `getGeocode`}), input$: autocompleteInput.selected$})

  const output$ = magicKeyComponent.result$
    .map(x => { 
      return {
        position: x.lngLat,
        city_state: normalizeArcGISSingleLineToParts(x.address)
      }
    })
    //.do(x => console.log(`output$`, x))
    .publishReplay(1).refCount()

  const waiting$ = combineObj({
    suggestion: suggestionComponent.waiting$,
    magicKey: magicKeyComponent.waiting$
  }).map((info: any) => info.magicKey || info.suggestion)
  
  //waiting$.subscribe(x => console.log(`waiting`, x))

  const out = {
    ...mergeSinks(autocompleteInput, suggestionComponent, magicKeyComponent), 
    DOM: autocompleteInput.DOM,
    output$,
    waiting$
  }

  return out
}