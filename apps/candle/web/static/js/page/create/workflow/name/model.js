import xs from 'xstream'
import Immutable from 'immutable'
import combineObj from '../../../combineObj'
import {getEmptyListing} from '../../../utils'



function reducers(actions, inputs) {

  const nameReducer$ = actions.name$.map(name => state => {
    const listing = state.get(`listing`)
    listing.name = name

    return state.set(`listing`, listing)
  })

  const setWaitingReducer$ = inputs.setWaiting$.map(() => state => {
    console.log(`create/name/model setting waiting`)
    return state.set(`waiting`, true)
  })

  const fromHTTPSuccessReducer$ = actions.fromHTTPSuccess$.map(fromHTTP => state => {
    console.log(`create/name/model setting listing`)
    console.log(fromHTTP)
    const listing = state.get(`listing`)
    listing.id = fromHTTP.id
    return state.set(`waiting`, false).set(`listing`, listing)
  })

  const fromHTTPErrorReducer$ = actions.fromHTTPError$.map(message => state => {
    console.log(`create/listingType/model setting error`)
    return state.set(`waiting`, false)
  })

  return xs.merge(
    nameReducer$,
    setWaitingReducer$,
    fromHTTPSuccessReducer$,
    fromHTTPErrorReducer$
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  console.log(`... name inputs`)
  console.log(inputs)
  return combineObj({
      listing$: inputs.listing$.take(1)
    })
    .map(inputs => {
      const initial = {
        waiting: false,
        listing: inputs.listing || getEmptyListing()
      }

      return reducer$.fold((acc, mod) => mod(acc), Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`name state...`)
    .remember()

}
