import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'

const log = console.log.bind(console)

function reducers(actions, inputs) {
  return O.never()
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .map(events => {
      const isValid = Array.isArray(events) && events
      return Immutable.Map({
        events: isValid ? events : []
      })
    })
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

