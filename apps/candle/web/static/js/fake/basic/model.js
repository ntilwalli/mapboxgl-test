import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../../utils'

function reducers(actions, inputs) {
  const showModalR = actions.showModal$.map(() => state => {
    return state.set(`showModal`, true)
  })

  const closeModalR = inputs.close$.map(() => state => {
    return state.set(`showModal`, false)
  })

  const doneModalR = inputs.done$.map(() => state => {
    return state.set(`showModal`, false)
  })

  const geoR = inputs.geolocation$.map(x => {
    return x
  }).skip(1).map(val => state => {
    return state.set(`geolocation`, val)
  })

  const authR = inputs.authorization$.skip(1).map(val => state => {
    return state.set(`authorization`, val)
  })

  return O.merge(showModalR, closeModalR, doneModalR, geoR)//, authR)
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    geolocation$: inputs.geolocation$,
    authorization$: inputs.authorization$
  }).take(1)
    .switchMap(({geolocation, authorization}) => {
      return reducer$
        .startWith(Immutable.Map({
          showModal: false,
          geolocation,
          authorization
        }))
        .scan((state, reducer) => reducer(state))
    })
    .map(x => x.toJS())
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}
