import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'

export default function main(sources, inputs, route) {
  return {
    //DOM: O.of(div([`Restricted`])),
    Global: O.of({
      type: `redirect`,
      data: `/restricted`
    }).delay(4)
  }
}
