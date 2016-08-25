import xs from 'xstream'
import Immutable from 'immutable'
import combineObj from '../../../combineObj'
import {getEmptyListing} from '../../../utils'

function isValid(listing) {
  return false
}

function reducers(actions, inputs) {

  return xs.merge(
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      listing$: inputs.listing$.take(1)
    })
    .map(inputs => {
      const initial = {
        listing: inputs.listing,
        isValid: false,
        errors: [],
        showPicker: false
      }

      initial.isValid = isValid(initial.listing)

      return reducer$.fold((acc, mod) => mod(acc), Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`eventDateTime state...`)
    .remember()

}
