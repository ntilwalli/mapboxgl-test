import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'

export default function main() {
  return {
    DOM: O.of(null),
    Global: O.of({
      type: `redirect`,
      data: `/create`
    })
  }
}
