import {Observable as O} from 'rxjs'
import {div, button, span, ul, li} from '@cycle/dom'
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
    return state.update('active', active => {
      return !active
    })
  })

  const notifications_r = channels_actions.notifications$.skip(1).map(notifications => state => {
    return state.set('notifications', notifications)
  })

  return O.merge(active_r, notifications_r)
}

function validIcon(selected) {
  return selected === 'settings' || selected === 'notifications' ? selected : undefined
}

function model(actions, channels_actions, inputs) {
  const reducer$ = reducers(actions, channels_actions, inputs)
  return combineObj({
    props$: inputs.props$,
    notifications$: channels_actions.notifications$.take(1)
  })
    .switchMap((info: any) => {
      const {props, notifications} = info
      return reducer$
        .startWith(Immutable.Map({
          active: false,
          selected: props,
          notifications
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => {
      return x.toJS()
    })
    .map(x => {
      return x
    })
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

function renderDropdownArrow(type, top, right) {
  return div('.arrow-' + type + '.btn.btn-link', {
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
  } else {
    return '.fa.fa-ellipsis-h'
  }
}

function renderStuff(notifications) {
  return ul('.list-unstyled.menu-items', [
    li(`.btn.btn-link.justify-content-between`, {class: {appNotificationsButton: true}}, [
      //div(`.btn.btn-link`, {class: {appNotificationsButton: true}}, [
        span([
          span('.fa.fa-bell.mr-4', []),
          `Notifications`
        ]),
        notifications.length ? span('.badge.bg-color-crayola.badge-pill', [notifications.filter(x => x && !x.read_at).length]) : null
      //]) 
    ]),
    li(`.btn.btn-link`, {class: {appSettingsButton: true}}, [
      //div(`.btn.btn-link`, {class: {appSettingsButton: true}}, [
        span([
          span('.fa.fa-gear.mr-4', []),
          `Settings`
        ])
      //]) 
    ])
  ])
}


function view(state$) {
  return state$.map(state => {
    const {active, selected, notifications} = state
    const item_class = validIcon(selected) ? '.selected' : '.not-selected'
    return span([
      span(item_class, [
        button('.appEllipsisButton' + '.btn.btn-link.menu-item', [
          span('.fa.mr-xs' + getIcon(selected), {style: {position: "relative"}}, [
            notifications.length ? renderAlertCircle(-5, -7) : null,
            !active ? renderDropdownArrow('right', 4, -18): renderDropdownArrow('down', 7, -15)
          ])
        ]),
        active ? div('.ellipsis-menu', [
          renderStuff(notifications)
        ]) : null
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
    output$: actions.selected$,
    active$: state$.pluck('active').distinctUntilChanged().publishReplay(1).refCount()
  }
}