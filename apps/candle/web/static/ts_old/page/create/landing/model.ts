import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, spread} from '../../../utils'

function reducers(actions, inputs) {
    return O.never()
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})

  return combineObj({
      props$: props$.take(1),
      listing$: actions.listing$.take(1)
    })
    .map(({props, listing}: any) => {
      return {
        waiting: false,
        errors: undefined,
        listing: listing
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod: Function) => mod(acc)))
    .map(x => (<any> x).toJS())
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

}
