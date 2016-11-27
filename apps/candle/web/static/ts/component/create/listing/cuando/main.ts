import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import model from './model'

export function main(sources, inputs) {
  const actions = {}
  const state$ = model(actions, inputs)
  return {
    DOM: O.of(div([`Hello`])),
    session$: state$.pluck(`session`),
    valid$: state$.pluck(`valid`)
  }
}