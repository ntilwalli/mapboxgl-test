import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj, spread, checkValidity} from '../../../utils'




function reducers(actions, inputs) {

  return O.never()
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    listing$: actions.listing$.take(1),
    authorization$: inputs.authorization$.take(1)
  })
    .map(info => {
      const {listing, authorization} = info
      return {
        authorization,
        listing
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc)))
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}
