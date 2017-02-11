import {Observable as O} from 'rxjs'
import Immutable = require('immutable')

function reducers(actions, inputs) {
  const show_modal_r = actions.show_modal$.skip(1).map(modal => state => {
    //console.log(modal)
    const curr_modal = state.get('modal')
    const new_modal = 
      curr_modal && curr_modal.type === 'leftMenu' ? 
        modal && modal.type === 'leftMenu' ? undefined 
          : modal 
        : modal
    return state.set(`modal`, new_modal)
  })

  const hide_modal_r = actions.hide_modal$.map(_ => state => {
    //console.log(`hideMenu`)
    return state.set(`modal`, null)
  })

  const main_messages_r = actions.main_messages$.map(messages => state => {
    console.log('Main messages received:', messages)
    return state.set('messages', Immutable.fromJS(messages))
  })

  const clear_message_r = actions.clear_message$.map(index => state => {
    const messages = state.get('messages').toJS()
    const new_messages = messages.splice(index, 1)
    return state.set('messages', Immutable.fromJS(new_messages))
  })
  
  return O.merge(show_modal_r, hide_modal_r, main_messages_r, clear_message_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return actions.show_modal$.take(1)
    .switchMap(modal => {
      return reducer$ 
        .startWith(Immutable.fromJS({
          modal: modal,
          messages: []
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`main state:`, x))
    .publishReplay(1).refCount()

}

export default model