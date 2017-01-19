import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'

export function main(sources, inputs) {
  return {
    DOM: inputs.props$
      .switchMap(props => {
        return O.of(div([`${props}`]))
      }).delay(4)
  }
}