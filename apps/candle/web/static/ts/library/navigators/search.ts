import {Observable as O} from 'rxjs'
import {div, button, span, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import moment = require('moment')
import {between, notBetween, combineObj, spread, componentify, createProxy} from '../../utils'

import Immutable = require('immutable')


function intent(sources) {
  const {DOM, Phoenix} = sources

  const show_menu$ = DOM.select('.appShowMenuButton').events('click')
    // .do(x =>{
    //   console.log('show_menu')
    // })
    .publish().refCount()

  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)
    .do(x =>{
      console.log('brand_button')
    })

  const addDay$ = DOM.select(`.appAddDay`).events(`click`)
    .mapTo({type: 'changeDay', data: 1})
  const subtractDay$ = DOM.select(`.appSubtractDay`).events(`click`)
    .mapTo({type: 'changeDay', data: -1})

  const change_date$ = O.merge(addDay$, subtractDay$)

  const show_filters$ = DOM.select(`.appShowFilters`).events(`click`)
    .mapTo({type: 'showFilters'})

  const show_calendar$ = DOM.select(`.appShowCalendar`).events(`click`)
    .mapTo({type: 'showCalendar'})


  return {
    show_menu$,
  
    brand_button$,
    output$: O.merge(change_date$, show_filters$, show_calendar$).publish().refCount()
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
      search_date_time$: inputs.props$.take(1),
      notifications$: channels_actions.notifications$.take(1),
      messages$: channels_actions.messages$.take(1)
    })
    .switchMap((info: any) => {
      return reducer$
        .startWith(Immutable.Map({
          search_date_time: info.search_date_time,
          notifications: info.notifications, 
          messages: info.messages
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
} 


function getDateDisplayString(dt) {
  const today = moment().startOf('day')
  const selected = dt.clone().startOf('day')
  //console.log(`isBefore?`, selected.isBefore(today))
  const diff = selected.diff(today, `days`)
  //console.log(diff)
  if (selected.isBefore(today)) {
    if (diff === -1) {
      //return [`${dt.format('ddd')} (Yesterday)`, ".past"]
      return [`Yesterday`, ".past"]
    }

    return [`${dt.format('dd')} ${dt.format('M/D')}`, ".past"]

  } else if (selected.isSame(today)) {
    //return [`${dt.format('ddd')} (Today)`, ".today"]
    return [`Today`, ".today"]
  } else if (selected.isAfter(today)) {
    if (diff === 1) {
      //return [`${dt.format('ddd')} (Tomorrow)`, ".future"]
      return [`Tomorrow`, ".future"]
    }

    return [`${dt.format('dd')} ${dt.format('M/D')}`, ".future"]
  }
}

function renderDateController(state) {
  const dt = state.search_date_time
  const [val, status] = getDateDisplayString(dt)
  return div('.col-4.d-flex.justify-content-between.search-controller', [
    button('.appSubtractDay.nav-text-button.fa.fa-arrow-left.fa-2x.btn.btn-link', []),
    button('.appShowCalendar.btn.btn-link', [val]),
    button('.appAddDay.nav-text-button.fa.fa-arrow-right.fa-2x.btn.btn-link.d-flex.justify-content-end'),
    //button(`.appShowFilters.nav-text-button.filter-button.fa.fa-cog.btn.btn-link`)
  ])
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


function view(state$) {
  return state$.map((state: any) => {
    const {notifications, messages} = state
    return div('.navbar.navbar-light.bg-faded.container-fluid.fixed-top.navigator', [
      div('.user-navigator.d-flex.fx-j-sb', [
        button('.appBrandButton.h-2.hopscotch-icon.btn.btn-link.nav-brand', []),
        renderDateController(state),
        span('.appShowMenuButton', [
          div('.nav-text-button.fa.fa-bars.btn.btn-link.pt-25', {style: {position: "relative"}}, [
            notifications.length + messages.length ? renderAlertCircle(2, -6) : null
          ]),
        ])
      ])
    ])
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const channels_actions = channelsIntent(sources, inputs)
  const state$ = model(actions, channels_actions, inputs)// inputs.props$.publishReplay(1).refCount()

  const vtree$ = view(state$)

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
    DOM: vtree$,
    Router: O.merge(
      actions.brand_button$.mapTo('/'),
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
    output$: actions.output$
  }
}