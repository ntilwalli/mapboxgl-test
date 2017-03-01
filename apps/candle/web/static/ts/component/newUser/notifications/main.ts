import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong, pre, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP} from '../../../utils'
import {inflateListing, inflateSession} from '../../helpers/listing/utils'


function intent(sources) {
  const {DOM, Phoenix} = sources

  return {

  }
}

function reducers(actions, inputs) {
  const notifications_r = inputs.notifications$.map(value => state => {
    return state.set('notifications', value.notifications).set('waiting', false)
  })

  return O.merge(notifications_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.Authorization.status$
    .map(authorization => {
      return {
        notifications: undefined,
        waiting: true
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}


// function renderSimpleRow(children) {
//   return div('.row', [div('.col-12', children)])
// }

// function renderSimpleTextCenterRow(children) {
//   return div('.row', [div('.col-12.text-xs-center', children)])
// }

function view(state$) {
  return combineObj({
    state$
  }).map((info: any) => {
    const {state} = info
    const {waiting} = state
    console.log('state', state)
    return waiting ? div('.loader') : div('.container.nav-fixed-offset.user-listings.mt-4', [
      state.notifications && state.notifications.length ? ul(state.notifications.map(x => li([
        pre([
          JSON.stringify(x, null, 2)
        ])
      ]))) : 'No notifications'
    ])
  })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const notifications$ = inputs.Authorization.status$.filter(Boolean).switchMap(user => {
    return sources.Phoenix.Channels.select('user:' + user.id).on('notifications')
  })
  const state$ = model(actions, {...inputs, notifications$})

  return {
    DOM: view(state$),
    Phoenix: inputs.Authorization.status$.filter(Boolean).map(user => {
      return {
        type: 'join',
        channel: 'user:' + user.id
      }
    }).map(x => {
      return x
    })
  }
}