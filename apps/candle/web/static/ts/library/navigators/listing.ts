import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {between, notBetween, combineObj, spread, componentify, createProxy} from '../../utils'

import Immutable = require('immutable')

import EllipsisItem from './ellipsisItem'

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

  const recurrences$ = DOM.select('.appRecurrencesButton').events('click').mapTo('recurrences')
  const messages$ = DOM.select('.appMessagesButton').events('click').mapTo('messages')
  const settings$ = DOM.select('.appSettingsButton').events('click').mapTo('settings')
  const calendar$ = DOM.select('.appCalendarButton').events('click').mapTo('calendar')
  const profile$ = DOM.select('.appProfileButton').events('click').mapTo('profile')
  const ellipsis$ = DOM.select('.appEllipsisButton').events('click').mapTo('ellipsis')
  const show_menu$ = DOM.select('.appShowMenuButton').events('click')
    .do(x =>{
      console.log('show_menu')
    })
    .publish().refCount()

  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)
    .do(x =>{
      console.log('brand_button')
    })

  return {
    page$: O.merge(
      recurrences$, messages$, settings$, calendar$, profile$
    ).publishReplay(1).refCount(),
    ellipsis$,
    show_menu$,
    brand_button$
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
  const notifications_r = channels_actions.notifications$.skip(1).map(notifications => state => {
    return state.set('notifications', notifications)
  })

  return O.merge(notifications_r)
}

function model(actions, channels_actions, inputs) {
  const reducer$ = reducers(actions, channels_actions, inputs)
  return combineObj({
      authorization$: inputs.Authorization.status$,
      listing_result$: inputs.props$,
      page$: inputs.page$,
      notifications$: channels_actions.notifications$.take(1),
      messages$: channels_actions.messages$.take(1)
    })
    .switchMap((info: any) => {
      return reducer$
        .startWith(Immutable.Map({
          listing_result: info.listing_result,
          authorization: info.authorization,
          page: info.page, 
          notifications: info.notifications, 
          messages: info.messages
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

function view(state$, ellipsis_item$) {
  return combineObj({state$, ellipsis_item$}).map((info: any) => {
    const {state, ellipsis_item} = info
    const {authorization, page, listing_result, notifications, messages} = state
    const type = listing_result && listing_result.listing && listing_result.listing.type
    const recurrences_class = page === 'recurrences' ? '.selected' : '.not-selected'
    const messages_class = page === 'messages' ? '.selected' : '.not-selected'
    const settings_class = page === 'settings' ? '.selected' : '.not-selected'
    const calendar_class = page === 'calendar' ? '.selected' : '.not-selected'
    const profile_class = page === 'profile' ? '.selected' : '.not-selected'
    const ellipses_class = page === 'ellipses' ? '.selected' : '.not-selected'
    return div('.user-navigator.d-flex.fx-j-sb', [
      button('.appBrandButton.h-2.hopscotch-icon.btn.btn-link.nav-brand', []),
      type === 'recurring' || authorization ? span('.sub-navigator', [
        type === 'recurring' || authorization ? span(profile_class, [button('.hidden-md-up.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-user', [])])]) : null,
        type === 'recurring' ? span(recurrences_class, [button('.hidden-md-up.btn.btn-link.appRecurrencesButton.menu-item', [span('.fa.fa-microphone', [])])]) : null,
        authorization ? span(messages_class, [
          button('.appMessagesButton.hidden-md-up.btn.btn-link.menu-item', [
            div('.fa.fa-envelope', {style: {position: "relative"}}, [
              messages.length ? renderAlertCircle(-4, -6) : null
            ]),
          ])
        ]) : null,
        authorization ? span(settings_class, [button('.hidden-md-up.btn.btn-link.appSettingsButton.menu-item', [span('.fa.fa-gear', [])])]) : null,
        ellipsis_item,
        //span(calendar_class, [button('.hidden-md-up.btn.btn-link.appCalendarButton.menu-item', [span('.fa.fa-calendar', [])])]),
        type === 'recurring' || authorization ? span(profile_class, [button('.hidden-sm-down.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-user.mr-xs', []), span('.fs-1', ['Profile'])])]) : null,
        type === 'recurring' ? span(recurrences_class, [button('.hidden-sm-down.btn.btn-link.appRecurrencesButton.menu-item', [span('.fa.fa-microphone.mr-xs', []), span('.fs-1', ['Recurrences'])])]) : null,
        authorization ? span(messages_class, [
          button('.hidden-sm-down.btn.btn-link.appMessagesButton.menu-item', [
            span('.fa.fa-envelope.mr-xs', {style: {position: "relative"}}, [
              messages.length ? renderAlertCircle(-4, -6) : null
            ]), 
            span('.fs-1', ['Messages'])
          ])]) : null,
        authorization ? span(settings_class, [button('.hidden-sm-down.btn.btn-link.appSettingsButton.menu-item', [span('.fa.fa-gear.mr-xs', []), span('.fs-1', ['Settings'])])]) : null,
        //span(calendar_class, [button('.hidden-sm-down.btn.btn-link.appCalendarButton.menu-item', [span('.fa.fa-calendar.mr-xs', []), span('.fs-1', ['Calendar'])])]),
      ]) : span('.navigator', []),
      span('.appShowMenuButton', [
        div('.nav-text-button.fa.fa-bars.btn.btn-link.pt-25', {style: {position: "relative"}}, [
          notifications.length + messages.length ? renderAlertCircle(2, -6) : null
        ]),
      ])
    ])
  })
}

function muxRouter(sources) {
  const {Router} = sources
  const route$ = Router.define(routes)
    .publishReplay(1).refCount()
  const valid_path$ = route$.filter(route => route.value.info.type === 'success')
    .map(route => {
      return route.value.info.data
    })
    .publishReplay(1).refCount()
  const invalid_path$ = route$.filter(route => route.value.info.type === 'error')
    .publishReplay(1).refCount()

  return {
    valid_path$,
    invalid_path$
  }
}

export default function main(sources, inputs) {
  const muxed_router = muxRouter(sources)
  const actions = intent(sources)
  const channels_actions = channelsIntent(sources, inputs)
  const external_selected$ = createProxy()
  const state$ = model(actions, channels_actions, {...inputs, page$: muxed_router.valid_path$})// inputs.props$.publishReplay(1).refCount()

  const ellipsis_item$ = inputs.Authorization.status$.map(status => {
    if (status) {
      return EllipsisItem(sources, {...inputs, props$: O.of({}), selected$: O.never()})
    } else {
      return {
        DOM: O.of(null),
        output$: O.never()
      }
    }
  }).publishReplay(1).refCount()

  const ellipsis_item = componentify(ellipsis_item$)

  const vtree$ = view(state$, ellipsis_item.DOM)

  const to_message_bus$ = actions.show_menu$
    .withLatestFrom(state$, (_, state) => {
      return {
        to: `main`, message: {
          type: `showLeftMenu`, 
          data: {redirect_url: state.listing_result && state.listing_result.listing && state.listing_result.listing.id ? '/listing/' + state.listing_result.listing.id : '/' }
        }
      }
    }).publish().refCount()

  return {
    ...ellipsis_item,
    DOM: vtree$,
    Router: O.merge(
      actions.brand_button$.mapTo('/'),
      actions.page$.withLatestFrom(state$, (page, state) => {
        const out = page === 'profile' ? sources.Router.createHref('') : sources.Router.createHref('/' + page)
        return {
          action: 'PUSH',
          type: 'push', 
          pathname: out,
          state: state.listing_result
        }
      })
    ),
    Phoenix: inputs.Authorization.status$.switchMap(status => {
      if (status) {
        return O.of({
          type: 'join',
          channel: 'user:' + status.id
        })
      } else {
        return O.never()
      }
    }),
    MessageBus: to_message_bus$,
    output$: state$.pluck('page').distinctUntilChanged()
  }
}