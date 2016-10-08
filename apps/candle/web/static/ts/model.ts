import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from './utils'

function waitingFilter(msg) {
  if (msg.type === `authorization`) return true

  return false
}

function reducers(actions, inputs) {
  const waitingR = inputs.message$
    .map(x => {
      return x
    })
    .filter(waitingFilter)
    .map(x => x.data)
    .filter(x => x.type === `waiting`)
    .map(x => x.data)
    .map(status => state => state.set(`waiting`, status))

  const showLeftMenuR= inputs.message$
    .map(x => {
      return x
    })
    .filter(x => x.type === `leftMenu`)
    .map(x => x.type)
    .map(x => state => {
      return state.set(`modal`, x)
    })

  const showAuthModalR = actions.modal$.skip(1).map(modal => state => state.set(`modal`, modal))

  const hideModalR = inputs.hideModal$.map(() => state => state.set(`modal`, null))

  const hideLeftMenuR = actions.thresholdUp$
    .map(() => state => {
      if(state.get(`modal`) === `leftMenu`) {
        return state.set(`modal`, null)
      } else {
        return state
      }
    })

  return O.merge(waitingR, showLeftMenuR, hideLeftMenuR, hideModalR, showAuthModalR)
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})
  return combineObj({
    props$,
    authorization$: inputs.authorization$.take(1),
    modal$: actions.modal$.take(1)
  }).map((inputs: any) => {
    const {props, authorization, modal} = inputs
    return {
      waiting: false,
      modal: modal//!authorization ? modal : null
    }
  })
  .switchMap(initialState => {

    return reducer$
      .startWith(Immutable.Map(initialState))
      .scan((acc, f: Function) => f(acc))
  })
  .map(x => (<any> x).toJS())
  //.do(x => console.log(`root state: `, x))
  .publishReplay(1).refCount()
}
