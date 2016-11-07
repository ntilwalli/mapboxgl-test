import {Observable as O} from 'rxjs'
import Immutable = require('immutable')

function reducers(actions, inputs) {
  const showMenuR = inputs.showMenu$.map(_ => state => {
    console.log(`show menu...`)
    return state.set(`modal`, `leftMenu`)
  })

  const hideMenuR = inputs.hideMenu$.map(_ => state => {
    return state.set(`modal`, null)
  })
  
  return O.merge(showMenuR, hideMenuR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return reducer$ 
    .startWith(Immutable.Map({
      modal: null
    }))
    .scan((acc, f: Function) => f(acc))
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

export default model