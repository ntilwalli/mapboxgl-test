import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../utils'

function reducers(actions, inputs) {
  const geolocationR = inputs.geolocation$.skip(1)
    .map(geo => state => {
      return state.set(`geolocation`, geo)
    })

  return O.merge(
    geolocationR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      authorization$: inputs.authorization$.take(1),
      geolocation$: inputs.geolocation$.take(1)
    })
    .map(({props, authorization, geolocation}: any) => {
      return {
        authorization,
        geolocation
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod: Function) => mod(acc)))
    .map(x => (<any> x).toJS())
    .publishReplay(1).refCount()
}
