import xs from 'xstream'
import Immutable from 'immutable'

function reducers(actions, inputs) {
  const selectedReducer$ = inputs.autocomplete$.map(sel => state => {
    console.log(`panel/location/model got new selected`)
    return state.set(`selected`, sel)
  })
  const modeReducer$ = inputs.radio$.map(mode => state => {
    console.log(`panel/location/model got new mode`)
    return state.set(`mode`, mode).set(`selected`, undefined)
  })
  return xs.merge(
    selectedReducer$,
    modeReducer$
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return (inputs.props$ || xs.of(undefined))
    .map(props => {
      const initial = {
        center: undefined,
        zoom: undefined,
        region: undefined
      }

      return reducer$.fold((acc, mod) => mod(acc), props ? Immutable.Map({...initial, ...props}) : Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`changeRegion state...`)
    .remember()

}
