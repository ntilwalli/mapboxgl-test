import {Observable as O} from 'rxjs'
import Immutable = require('immutable')

function reducers(actions, inputs) {
  const showModalR = inputs.showModal$.skip(1).map(modal => state => {
    return state.set(`modal`, modal)
  })

  const hideModalR = inputs.hideModal$.map(_ => state => {
    //console.log(`hideMenu`)
    return state.set(`modal`, null)
  })
  
  return O.merge(showModalR, hideModalR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.showModal$.take(1)
    .switchMap(modal => {
      return reducer$ 
        .startWith(Immutable.Map({
          modal: modal
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`main state:`, x))
    .publishReplay(1).refCount()

}

export default model