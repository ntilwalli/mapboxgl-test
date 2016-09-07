import xs from 'xstream'
import Immutable from 'immutable'
import combineObj from '../../../combineObj'
import {getEmptyListing} from '../../../utils'



function reducers(actions, inputs) {

  const typeReducer$ = inputs.radio$.map(mode => state => {
    const listing = state.get(`listing`)
    listing.type = mode

    return state.set(`listing`, listing)
  })

  // const setWaitingReducer$ = inputs.setWaiting$.map(() => state => {
  //   console.log(`create/listingType/model setting waiting`)
  //   return state.set(`waiting`, true)
  // })

  // const fromHTTPSuccessReducer$ = actions.fromHTTPSuccess$.map(fromHTTP => state => {
  //   console.log(`create/listingType/model setting listing`)
  //   console.log(fromHTTP)
  //   const listing = state.get(`listing`) || getEmptyListing()
  //   listing.id = fromHTTP.id
  //   return state.set(`waiting`, false).set(`listing`, listing)
  // })
  //
  // const fromHTTPErrorReducer$ = actions.fromHTTPError$.map(message => state => {
  //   console.log(`create/listingType/model setting error`)
  //   return state.set(`waiting`, false)
  // })

  return xs.merge(
    typeReducer$//,
    //setWaitingReducer$,
    // fromHTTPSuccessReducer$,
    // fromHTTPErrorReducer$
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      listing$: inputs.listing$.take(1)
    })
    .map(inputs => {
      console.log(`listing type init listing`)
      console.log(inputs.listing)
      const initial = {
        waiting: false,
        listing: inputs.listing || getEmptyListing()
      }

      return reducer$.fold((acc, mod) => mod(acc), Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`listingType state...`)
    .remember()

}
