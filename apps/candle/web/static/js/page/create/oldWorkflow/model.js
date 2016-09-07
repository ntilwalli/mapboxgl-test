import xs from 'xstream'
import Immutable from 'immutable'
import combineObj from '../../combineObj'

function reducers(actions, inputs) {

  const listingReducer$ = inputs.listing$.drop(1).map(listing => state => {
    return state.set(`listing`, listing)
  })

  const showMenuReducer$ = inputs.showMenu$.map(val => state => {
    return state.set(`showMenu`, val)
  })

  const openInstructionReducer$ = actions.openInstruction$.map(() => state => {
    return state.set(`showInstruction`, true)
  })

  const closeInstructionReducer$ = actions.closeInstruction$.map(() => state => {
    return state.set(`showInstruction`, false)
  })

  return xs.merge(
    listingReducer$,
    showMenuReducer$,
    openInstructionReducer$,
    closeInstructionReducer$
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      props$: inputs.props$,
      authorization$: inputs.authorization$.take(1),
      userLocation$: inputs.userLocation$.take(1),
      listing$: inputs.listing$.take(1)
    })
    .map(({props, authorization, userLocation, listing}) => {
      const initial = {
        authorization,
        userLocation,
        persistUrl: props.persistUrl,
        validator: props.validator,
        listing: listing || undefined,
        showMenu: false,
        showInstructions: false
      }

      return reducer$.fold((acc, mod) => mod(acc), Immutable.Map({...initial, ...props}))
    })
    .flatten()
    .map(x => x.toObject())
    //.debug(`workflow state$...`)
    .remember()

}
