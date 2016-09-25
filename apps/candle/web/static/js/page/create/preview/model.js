import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj, spread, checkValidity} from '../../../utils'
import {validateDescription as isValid} from '../listing'

function setValid(state) {
  const listing = state.get(`listing`)

  return state.set(`valid`, isValid(listing))
}

function reducers(actions, inputs) {

  return O.never()
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    listing$: inputs.listing$.take(1),
    authorization$: inputs.authorization$.take(1)
  })
    .map(info => {
      const {listing, authorization} = info
      const valid = isValid(listing)
      return {
        authorization,
        listing,
        valid
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc)))
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}
