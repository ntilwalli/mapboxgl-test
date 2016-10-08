import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, span, input, li, i} from '@cycle/dom'
import {attrs, combineObj, normalizeComponent} from '../../utils'

import AutocompleteInput from '../autocompleteInput'

const itemConfigs = {
  default: {
    selectable: true,
    renderer: (suggestion, index, highlighted) => {
      return li(
        `.populated-place-autocomplete-item.autocomplete-item-style.custom-autocomplete-input-style.${highlighted ? '.light-gray' : ''}`,
        {attrs: {'data-index': index}},
        [
          span(`.populated-place-info`, [suggestion.name])
        ]
      )
    }
  }
}

function intent(sources) {
  return {}
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})
  const initialState$ = inputs.initialState$ || O.of({})
  return combineObj({props$, initialState$})
    .map((inputs: any) => inputs.initialState)
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f: Function) => f(acc)))
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map((inputs: any) => {
      const {state, components} = inputs
      const {autocomplete} = components
      return div(`.search-box`, [
        div(`.search-area`, [
          i(`.fa.fa-search.search-area-icon`),
          autocomplete,
          i(`.appSearchConfiguration.search-area-icon.fa.fa-gear.icon`)
        ])
      ])
    })
}

export default function main(sources, inputs) {
  const searchInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => ({
      results$: O.never(),
      HTTP: O.never()
    }),
    itemConfigs,
    displayFunction: x => x,
    placeholder: `Search by category`
  })


  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const components = {
    autocomplete: searchInput.DOM//O.of(div([`Hello`]))
  }
  const vtree$ = view(state$, components)
  
  return normalizeComponent({
    DOM: vtree$
  })

}
