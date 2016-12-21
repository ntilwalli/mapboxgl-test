import {Observable as O} from 'rxjs'
import {div, button, img, span, i, a} from '@cycle/dom'
import {combineObj} from '../../utils'

export default function main(sources, inputs) {
  return {
    DOM: O.of(div('.row', [
      div('.col-xs-12', [
        'MyListings'
      ])
    ]))
  }
}