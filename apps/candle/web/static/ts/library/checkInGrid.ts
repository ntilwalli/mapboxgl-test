import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, spread} from '../utils'

function view(state$) {
  return state$.map(state => {
    return div(`.check-in-grid`, [`Check-in grid`])
  })
}
export function main(sources, inputs) {
  const state$ = O.of(undefined)
  const vtree$ = view(state$) 
  return {
    DOM: vtree$
  }
}