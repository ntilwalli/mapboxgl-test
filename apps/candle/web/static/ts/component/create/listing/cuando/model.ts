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
  return combineObj({
      session$: actions.session$
    })
    .switchMap((info: any) => {
      const {session} = info
      const init = {
        session,
        valid: false,
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}