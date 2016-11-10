import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj} from '.../../../utils'

function main(sources, inputs) {
  return {
    DOM: O.of(`Hello darling`)
  }
}

export default main