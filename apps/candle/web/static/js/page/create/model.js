import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../../utils'

function reducers(actions, inputs) {
  const stopWaitingReducer$ = actions.fromHTTP$
    .map(listing => state => {
      return state.set(`waiting`, false)
    })
    
  const startWaitingReducer$ = inputs.startWaiting$
    .map(() => state => {
      return state.set(`waiting`, true)
    })

  return O.merge(
    stopWaitingReducer$,
    startWaitingReducer$
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    props$: inputs.props$ || O.of({}),
    initialState$: actions.initialState$
  }).switchMap(({props, initialState}) => {
      return reducer$
        .startWith(Immutable.Map(initialState))
        .scan((acc, mod) => mod(acc))
    })
    .map(x => x.toJS())
    // .do(x => {
    //   console.log(`from create state$...`, x)
    // })
    .publishReplay(1).refCount()

}
