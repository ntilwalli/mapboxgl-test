import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'

function reducers(actions, inputs) {
  const cuando_r = inputs.cuando$.map(cuando => state => {
    return state.update(`session`, x => {
      x.session.listing.cuando = cuando
      return x
    })
  })

  return O.merge(cuando_r)
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.session$.switchMap(session => {
    const init = {
      session,
      valid: false,
    }

    return reducer$.startWith(init).scan((acc, f: Function) => f(acc))
  })
  .map((x: any) => x.toJS())
  .publishReplay(1).refCount()
}