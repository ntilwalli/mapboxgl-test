import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'

export function main(source, inputs) {
  return {
    DOM: O.of(div([`Profile`]))
  }
}