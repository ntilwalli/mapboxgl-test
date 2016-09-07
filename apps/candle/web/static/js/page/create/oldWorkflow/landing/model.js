import xs from 'xstream'
import Immutable from 'immutable'
import combineObj from '../../../combineObj'
import {getEmptyListing} from '../../../utils'

function reducers(actions, inputs) {
    return xs.never()
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  console.log(inputs)

  return combineObj({
      props$: inputs.props$,
      listing$: inputs.listing$.take(1)
    })
    .map(({props, listing}) => {
      console.log(`landing listing`)
      console.log(listing)
      const initial = {
        waiting: false,
        errors: undefined,
        listing: listing || getEmptyListing()
      }

      return reducer$.fold((acc, mod) => mod(acc), props ? Immutable.Map({...initial, ...props}) : Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`landing state...`)
    .remember()

}
