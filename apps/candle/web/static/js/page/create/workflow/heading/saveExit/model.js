import xs from 'xstream'
import Immutable from 'immutable'

function reducers(actions, inputs) {
  const isSavingReducer$ = xs.merge(
    inputs.message$.filter(x => x.data === `saving`).mapTo(true),
    inputs.message$.filter(x => x.data === `done saving`).mapTo(false)
  ).map(val => state => {
    let lastSaved = state.get(`lastSaved`)
    const isSaving = state.get(`isSaving`)
    if (val === false && isSaving) {
      lastSaved = new Date()
    }
    return state.set(`isSaving`, val).set(`lastSaved`, lastSaved)
  })

  const statusReducer$ = inputs.message$
    .filter(x => x.type === `status`)
    .map(val => state => state.set(`status`, val.data))

  const instructionReducer$ = inputs.message$
    .filter(x => x.type === `instruction`)
    .map(val => state => state.set(`instruction`, val.data))

  return xs.merge(isSavingReducer$, statusReducer$)
}

export default function model(actions, inputs) {
  const mod$ = reducers(actions, inputs)

  return inputs.parentState$
    .map(props => {
      const initial = {
        isSaving: false,
        lastSaved: undefined,
        status: undefined,
        instruction: undefined
      }

      return mod$.fold((acc, mod) => mod(acc), props ? Immutable.Map({...initial, ...props}) : Immutable.Map(initial))
    })
    .flatten()
    .map(x => x.toObject())
    .debug(`saveExit state...`)
    .remember()

}
