import xs from 'xstream'
import view from './view'
import intent from './intent'
import model from './model'

import {div} from '@cycle/DOM'
import combineObj from '../../../combineObj'

import AutocompleteInput from '../../../general/autocompleteInput'
import ArcGISSuggest from '../../../service/ArcGISSuggest'

import {noopListener} from '../../../utils'

// function suggester({HTTP, input$}) {
//   const noLength$ = input$.filter(x => x.length === 0)
//   const hasLength$ = input$.filter(x => x.length > 0)
//
//   const noLengthResults$ = noLength$.map(() => [{
//     displayValue: `Samantha Mulvany`,
//     value: {a: `x1`, b: `y1`},
//     type: `default`
//   }, {
//     displayValue: `Kevin Love`,
//     value: {a: `x3`, b: `y3`},
//     type: `default`
//   }, {
//     displayValue: `Something else`,
//     value: {a: `x2`, b: `y2`},
//     type: `default`
//   }, {
//     displayValue: `Something else 2`,
//     value: {a: `x3`, b: `y3`},
//     type: `default`
//   }])
//
//   const hasLengthResults$ = hasLength$.map(() => [{
//     displayValue: `With length 1`,
//     value: {a: `a1`, b: `b1`},
//     type: `default`
//   }, {
//     displayValue: `With length 2`,
//     value: {a: `a2`, b: `b2`},
//     type: `default`
//   }])
//
//   return {
//     results$: xs.merge(noLengthResults$, hasLengthResults$).remember(),
//     HTTP: xs.never()
//   }
// }

const itemConfigs = {
  default: {
    selectable: true
  }
}

const suggesterProps = {
  maxSuggestions: 5,
  category: undefined,
  countryCode: undefined
}

const getSuggester = (props, center$) => ({input$, HTTP}) => ArcGISSuggest(props, input$, center$, HTTP)


export default function main(sources) {

  const center$ = sources.props$.map(props => props.position)

  const autocompleteInput = AutocompleteInput(sources, getSuggester(suggesterProps, center$), itemConfigs)

  const actions = intent(sources)
  //radioInput.selected$.debug().addListener(noopListener)
  //const state$ = model(actions, {autocomplete$: autocompleteInput.selected$, radio$: })
  const state$ = model(actions, {autocomplete$: autocompleteInput.selected$})
  const vtree$ = view({state$, components: {autocomplete: autocompleteInput.DOM}})

  return {
    DOM: vtree$,
    HTTP: autocompleteInput.HTTP,
    Router: xs.never(),
    Global: autocompleteInput.Global
  }
}
