import {Observable as O} from 'rxjs'
import Immutable = require('immutable')

function reducers(actions, inputs) {
  const show_modal_r = actions.show_modal$.skip(1).map(modal => state => {
    //console.log(modal)
    const curr_modal = state.get('modal')
    const new_modal = curr_modal && curr_modal.type === 'leftMenu' ? modal && modal.type === 'leftMenu' ? undefined : modal : modal
    return state.set(`modal`, new_modal)
  })

  const hide_modal_r = actions.hide_modal$.map(_ => state => {
    //console.log(`hideMenu`)
    return state.set(`modal`, null)
  })
  
  return O.merge(show_modal_r, hide_modal_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return actions.show_modal$.take(1)
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