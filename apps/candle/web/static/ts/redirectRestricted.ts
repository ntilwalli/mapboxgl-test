import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'

export default function main() {
  return {
    Global: O.of({
      type: `redirect`,
      data: `/restricted`
    }).delay(4)
  }
}
