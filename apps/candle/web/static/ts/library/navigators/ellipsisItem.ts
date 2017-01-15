import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {between, notBetween, combineObj, spread} from '../../utils'

import Immutable = require('immutable')

const routes = [
  {pattern: /^\/profile$/, value: {type: 'success', data: 'profile'}},
  {pattern: /^\/recurrences$/, value: {type: 'success', data: 'recurrences'}},
  {pattern: /^\/messages$/, value: {type: 'success', data: 'messages'}},
  {pattern: /^\/settings$/, value: {type: 'success', data: 'settings'}},
  {pattern: /^\/$/, value: {type: 'success', data: 'profile'}},
  {pattern: /.*/, value: {type: "error"}}
]

function intent(sources) {
  const {DOM, Phoenix} = sources

  const active$ = DOM.select('.appEllipsisButton').events('click')
  const settings$ = DOM.select('.appSettingsButton').events('click').mapTo('settings')
  const notifications$ = DOM.select('.appNotificationsButton').events('click').mapTo('notifications')

  return {
    active$, 
    selected$: O.merge(notifications$, settings$)
  }
}

function channelsIntent(sources, inputs) {
  const {Phoenix} = sources
  const {Authorization} = inputs

  const notifications$ = Authorization.status$
    .switchMap(status => {
      if (status) {
        return Phoenix.Channels.select('user:' + status.id).on('notifications')
          .map(x => {
            return x
          })
          .pluck('notifications')
          .publishReplay(1)
          .refCount()
      } else {
        return O.of([])
      }
    })

  const messages$ = Authorization.status$
    .switchMap(status => {
      // if (status) {
      //   return Phoenix.Channels.select('user:' + status.id).on('messages')
      //     .map(x => {
      //       return x
      //     })
      //     .pluck('messages')
      //     .publishReplay(1)
      //     .refCount()
      // } else {
        return O.of([])
      // }
    })  

  return {
    notifications$,
    messages$
  }
}

function reducers(actions, channels_actions, inputs) {
  const active_r = actions.active$.map(_ => state => {
    state.update('active', active => !active)
  })

  const selected_r = actions.selected$.map(selected => state => {
    state.set('selected', selected).set('display_icon', selected).set('active', false)
  })

  const unselected_r = inputs.selected$.map(_ => state => {
    state.set('selected', undefined).set('active', false)
  })

  const notifications_r = channels_actions.notifications$.skip(1).map(notifications => state => {
    return state.set('notifications', notifications)
  })

  return O.merge(active_r, selected_r, unselected_r, notifications_r)
}

function model(actions, channels_actions, inputs) {
  const reducer$ = reducers(actions, channels_actions, inputs)
  return combineObj({
    props$: inputs.props$,
    notifications$: channels_actions.notifications$.take(1)
  })
    .switchMap((info: any) => {
      const {props} = info
      return reducer$
        .startWith(Immutable.Map({
          active: false,
          display_icon: props.selected || 'settings',
          selected: props.selected || undefined,
          menu_options: ['settings', 'notifications']
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
} 

function renderAlertCircle(top, right) {
  return div('.rounded-circle', {
    style: {
      position: "absolute", 
      "z-index": 1000, 
      width: "8px", 
      height: "8px", 
      top: top + "px", 
      right: right + "px", 
      "background-color": "rgba(255, 117, 56, 1)"
    }}, [])
}

function renderDropdownArrow(top, right) {
  return div('.arrow-down.btn.btn-link', {
    style: {
      position: "absolute", 
      "z-index": 1000, 
      // width: 0, 
      // height: 0, 
      top: top + "px", 
      right: right + "px", 
      // "border-left": "5px solid transparent",
      // "border-right": "5px solid transparent",
      // "border-top": "5px solid #000"
    }}, [])
}


function getIcon(selected) {
  if (selected === 'notifications') {
    return '.fa.fa-bell'
  } else if (selected === 'settings') {
    return '.fa.fa-gear'
  }
}


function view(state$) {
  return state$.map(state => {
    const {active, selected, menu_options, display_icon} = state
    const item_class = active ? '.selected' : '.not-selected'
    return span([
      div('.appEllipsisButton' + item_class, [
        button('.btn.btn-link.appProfileButton.menu-item', [
          span('.fa.mr-xs' + getIcon(display_icon), {style: {position: "relative"}}, [
            renderAlertCircle(-5, -7),
            renderDropdownArrow(9, -15)
          ])
        ])
      ])
    ])
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const channels_actions = channelsIntent(sources, inputs)
  const state$ = model(actions, channels_actions, inputs)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    output$: state$.pluck('selected').distinctUntilChanged()
  }
}