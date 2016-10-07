// import xs from 'xstream'
// import Immutable from 'immutable'
// import combineObj from '../../../combineObj'
//
// function normalizeListing(listing) {
//   if (!listing) {
//     return {
//       id: undefined,
//       location: {
//         mode: undefined,
//         selected: undefined
//       }
//     }
//   } else {
//     return listing
//   }
// }
//
// function reducers(actions, inputs) {
//
//   const selectedReducer$ = inputs.autocomplete$.map(sel => state => {
//     console.log(`panel/location/model got new selected`)
//     const listing = normalizeListing(state.get(`listing`))
//     listing.location.selected = sel
//     return state.set(`listing`, listing)
//   })
//   const modeReducer$ = inputs.radio$.map(mode => state => {
//     const listing = normalizeListing(state.get(`listing`))
//     listing.location.selected = undefined
//     listing.location.mode = mode
//
//     return state.set(`listing`, listing)
//   })
//
//   const userLocationReducer$ = inputs.userLocation$.drop(1).map(loc => state => {
//     return state.set(`userLocation`, loc)
//   })
//
//   const setWaitingReducer$ = inputs.setWaiting$.map(() => state => {
//     console.log(`create/landing/model setting waiting`)
//     return state.set(`waiting`, true)
//   })
//
//   const fromHTTPSuccessReducer$ = actions.fromHTTPSuccess$.map(listing => state => {
//     console.log(`create/landing/model setting listing`)
//     return state.set(`waiting`, false).set(`listing`, listing)
//   })
//
//   const fromHTTPErrorReducer$ = actions.fromHTTPError$.map(message => state => {
//     console.log(`create/landing/model setting error`)
//     return state.set(`waiting`, false)
//   })
//
//
//   return xs.merge(
//     selectedReducer$,
//     modeReducer$,
//     userLocationReducer$,
//     setWaitingReducer$,
//     fromHTTPSuccessReducer$,
//     fromHTTPErrorReducer$
//   )
// }
//
// export default function model(actions, inputs) {
//   const reducer$ = reducers(actions, inputs)
//
//   return combineObj({
//       props$: inputs.props$,
//       authorization$: inputs.authorization$.take(1),
//       userLocation$: inputs.userLocation$.take(1),
//       listing$: inputs.listing$.take(1)
//     })
//     .map(inputs => {
//       const initial = {
//         waiting: false,
//         authorization: inputs.authorization,
//         userLocation: inputs.userLocation,
//         listing: inputs.listing || undefined//,
//         //mode: inputs.listing && inputs.listing.mode || undefined,
//         //selected: inputs.listing && inputs.listing.selected || undefined
//       }
//
//       return reducer$.fold((acc, mod) => mod(acc), Immutable.Map(initial))
//     })
//     .flatten()
//     .map(x => x.toObject())
//     .debug(`location state...`)
//     .remember()
//
// }
