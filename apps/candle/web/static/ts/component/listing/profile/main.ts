import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj} from '../../../utils'

export function main(sources, inputs) {
  return {
    DOM: O.of(`Hello darling`)
  }
}
