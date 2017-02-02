import {Observable as O} from 'rxjs'
import {div, button, span, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {between, notBetween, combineObj, spread, componentify, createProxy} from '../../utils'
import {notRead, isThisListing, isListingObject} from '../../notificationUtils'
import Immutable = require('immutable')

const routes = [
  {pattern: /^\/profile$/, value: {type: 'success', data: 'profile'}},
  {pattern: /^\/listings$/, value: {type: 'success', data: 'listings'}},
  {pattern: /^\/messages$/, value: {type: 'success', data: 'messages'}},
  {pattern: /^\/settings$/, value: {type: 'success', data: 'settings'}},
  {pattern: /^\/notifications$/, value: {type: 'success', data: 'notifications'}},
  {pattern: /^\/settings$/, value: {type: 'success', data: 'settings'}},
  {pattern: /^\/$/, value: {type: 'success', data: 'profile'}},
  {pattern: /.*/, value: {type: "error"}}
]

function intent(sources) {
  const {DOM, Phoenix, Global} = sources

  const listings$ = DOM.select('.appListingsButton').events('click').mapTo('listings')
  const messages$ = DOM.select('.appMessagesButton').events('click').mapTo('messages')
  const settings$ = DOM.select('.appSettingsButton').events('click').mapTo('settings')
  //const calendar$ = DOM.select('.appCalendarButton').events('click').mapTo('calendar')
  const notifications$ = DOM.select('.appNotificationsButton').events('click').mapTo('notifications')
  const profile$ = DOM.select('.appProfileButton').events('click').mapTo('profile')
  const ellipsis_menu$ = DOM.select('.appEllipsisButton').events('click').mapTo('ellipsis')
  const show_menu$ = DOM.select('.appShowMenuButton').events('click')
    .publish().refCount()

  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)
    .do(x =>{
      console.log('brand_button')
    })

  return {
    page$: O.merge(
      listings$, messages$, profile$, settings$, notifications$
    )
    .map(x => {
      return x
    })
    .publishReplay(1).refCount(),
    ellipsis_menu$,
    brand_button$,
    show_menu$,
    resize$: Global.resize$,
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

  const ellipsis_menu_r = actions.ellipsis_menu$.map(_ => state => {
    return state.update('show_ellipsis_menu', val=> !val)
  })

  const close_r = O.merge(actions.resize$, (inputs.close_menu$ || O.never())).map(_ => state => {
    return state.set('show_ellipsis_menu', false)
  })

  return O.merge(notifications_r, ellipsis_menu_r, close_r)
}

function model(actions, channels_actions, inputs) {
  const reducer$ = reducers(actions, channels_actions, inputs)
  return combineObj({
      authorization$: inputs.Authorization.status$,
      user_result$: inputs.props$,
      page$: inputs.page$,
      notifications$: channels_actions.notifications$.take(1),
      messages$: channels_actions.messages$.take(1)
    })
    .switchMap((info: any) => {
      return reducer$
        .startWith(Immutable.Map({
          show_ellipsis_menu: false,
          user_result: info.user_result,
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

function getEllipsisIcon(page) {
  if (page === 'notifications') {
    return '.fa.fa-bell'
  } else if (page === 'settings') {
    return '.fa.fa-gear'
  } else {
    return '.fa.fa-ellipsis-h'
  }
}

function renderStuff(notifications) {
  const user_notifications = notifications
          .filter(notRead)

  return ul('.list-unstyled.menu-items', [
    li('.appNotificationsButton.btn.btn-link.justify-content-between', [
      //div(`.btn.btn-link`, {class: {appNotificationsButton: true}}, [
        span([
          span('.fa.fa-bell.mr-4', []),
          `Notifications`
        ]),
        user_notifications.length ? span('.badge.bg-color-crayola.badge-pill', [user_notifications.length]) : null
      //]) 
    ]),
    li('.appSettingsButton.btn.btn-link', [
      //div(`.btn.btn-link`, {class: {appSettingsButton: true}}, [
        span([
          span('.fa.fa-gear.mr-4', []),
          `Settings`
        ])
      //]) 
    ])
  ])
}

function ellipsisSelected(page) {
  return ['calendar', 'settings', 'messages'].some(x => x === page)
}

function isAuthorizedUser(user_result, authorization) {
  if (authorization) {
    return user_result === authorization.id || ['ntilwalli', 'tiger', 'nikhil'].some(x => x === authorization.username)
  } else {
    return false
  }
}

function view(state$) {
  return combineObj({state$}).map((info: any) => {
    const {state} = info
    const {authorization, page, user_result, notifications, messages, show_ellipsis_menu} = state
    const listings_class = page === 'listings' ? '.selected' : '.not-selected'
    const messages_class = page === 'messages' ? '.selected' : '.not-selected'
    const settings_class = page === 'settings' ? '.selected' : '.not-selected'
    const calendar_class = page === 'calendar' ? '.selected' : '.not-selected'
    const profile_class = page === 'profile' ? '.selected' : '.not-selected'
    const ellipsis_class = ellipsisSelected(page) ? '.selected' : '.not-selected'

    const user_notifications = notifications
          .filter(notRead)


    return div([
      div('.navbar.navbar-light.bg-faded.container-fluid.fixed-top.navigator', [
        div('.user-navigator.d-flex.fx-j-sb', [
          button('.appBrandButton.h-2.hopscotch-icon.btn.btn-link.nav-brand', []),
          isAuthorizedUser(user_result, authorization) ? span('.sub-navigator', [
            isAuthorizedUser(user_result, authorization) ? span('.hidden-md-up' + profile_class, [button('.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-info', [])])]) : null,
            span('.hidden-md-up' + listings_class, [button('.btn.btn-link.appListingsButton.menu-item', [span('.fa.fa-microphone', [])])]),
            isAuthorizedUser(user_result, authorization) ? span('.hidden-md-up' + messages_class, [
              button('.appMessagesButton.btn.btn-link.menu-item', [
                div('.fa.fa-envelope', {style: {position: "relative"}}, [
                  messages.length ? renderAlertCircle(-4, -6) : null
                ]),
              ])
            ]) : null,
            isAuthorizedUser(user_result, authorization) ? span('.hidden-md-up' + ellipsis_class, [
              button('.appEllipsisButton.btn.btn-link.menu-item', [
                span('.fa.mr-xs' + getEllipsisIcon(page), {style: {position: "relative"}}, [
                  user_notifications.length ? renderAlertCircle(-5, -7) : null,
                  !show_ellipsis_menu ? renderDropdownArrow('right', 4, -18): renderDropdownArrow('down', 7, -15)
                ])
              ])
            ]) : null,
            //span(calendar_class, [button('.hidden-md-up.btn.btn-link.appCalendarButton.menu-item', [span('.fa.fa-calendar', [])])]),
            isAuthorizedUser(user_result, authorization) ? span('.hidden-sm-down' + profile_class, [button('.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-info.mr-xs', []), span('.fs-1', ['Profile'])])]) : null,
            span('.hidden-sm-down' + listings_class, [button('.hidden-sm-down.btn.btn-link.appRecurrencesButton.menu-item', [span('.fa.fa-microphone.mr-xs', []), span('.fs-1', ['Recurrences'])])]),
            isAuthorizedUser(user_result, authorization) ? span('.hidden-sm-down' + messages_class, [
              button('.btn.btn-link.appMessagesButton.menu-item', [
                span('.fa.fa-envelope.mr-xs', {style: {position: "relative"}}, [
                  messages.length ? renderAlertCircle(-4, -6) : null
                ]), 
                span('.fs-1', ['Messages'])
              ])
            ]) : null,
            isAuthorizedUser(user_result, authorization) ? span('.hidden-sm-down' + messages_class, [
              button('.btn.btn-link.appNotificationsButton.menu-item', [
                span('.fa.fa-bell.mr-xs', {style: {position: "relative"}}, [
                  user_notifications.length ? renderAlertCircle(-4, -6) : null
                ]), 
                span('.fs-1', ['Notifications'])
              ])
            ]) : null,
            isAuthorizedUser(user_result, authorization) ? span('.hidden-sm-down' + messages_class, [
              button('.btn.btn-link.appSettingsButton.menu-item', [
                span('.fa.fa-gear.mr-xs', {style: {position: "relative"}}, []), 
                span('.fs-1', ['Settings'])
              ])
            ]) : null,
            //span(calendar_class, [button('.hidden-sm-down.btn.btn-link.appCalendarButton.menu-item', [span('.fa.fa-calendar.mr-xs', []), span('.fs-1', ['Calendar'])])]),
          ]) : span('.navigator', []),
          span('.appShowMenuButton', [
            div('.nav-text-button.fa.fa-bars.btn.btn-link.pt-25', {style: {position: "relative"}}, [
              notifications.filter(notRead).length + messages.length ? renderAlertCircle(2, -6) : null
            ])
          ])
        ])
      ]),
      show_ellipsis_menu ? div('.ellipsis-menu', [renderStuff(notifications)]) : null 
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
  const state$ = model(actions, channels_actions, {...inputs, page$: muxed_router.valid_path$})// inputs.props$.publishReplay(1).refCount()

  // const ellipsis_item$ = inputs.Authorization.status$.map(status => {
  //   if (status) {
  //     return EllipsisItem(sources, {...inputs, props$: muxed_router.valid_path$})
  //   } else {
  //     return {
  //       DOM: O.of(null),
  //       output$: O.never()
  //     }
  //   }
  // }).publishReplay(1).refCount()

  // const ellipsis_item = componentify(ellipsis_item$)
  const vtree$ = view(state$)

  const to_message_bus$ = actions.show_menu$
    .withLatestFrom(state$, (_, state: any) => {
      return {
        to: `main`, message: {
          type: `showLeftMenu`, 
          data: {redirect_url: '/home'}
        }
      }
    }).publish().refCount()

  const page$ = O.merge(actions.page$)
    .map(x => {
      return x
    })

  return {
    DOM: vtree$,
    Router: O.merge(
      actions.brand_button$.mapTo('/'),
      page$.withLatestFrom(state$, (page, state: any) => {
        const out = page === 'profile' ? sources.Router.createHref('') : sources.Router.createHref('/' + page)
        return {
          action: 'PUSH',
          type: 'push', 
          pathname: out,
          state: state.user_result
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
    output$: state$.pluck('page').distinctUntilChanged(),
    active$: state$.pluck('show_ellipsis_menu').distinctUntilChanged()
  }
}