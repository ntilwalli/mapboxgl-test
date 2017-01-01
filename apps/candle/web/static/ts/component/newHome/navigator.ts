import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../utils'

const routes = [
  {pattern: /^\/profile$/, value: {type: 'success', data: 'profile'}},
  {pattern: /^\/listings$/, value: {type: 'success', data: 'listings'}},
  {pattern: /^\/messages$/, value: {type: 'success', data: 'messages'}},
  {pattern: /^\/settings$/, value: {type: 'success', data: 'settings'}},
  {pattern: /^\/$/, value: {type: 'success', data: 'profile'}},
  {pattern: /.*/, value: {type: "error"}}
]

function intent(sources) {
  const {DOM} = sources

  const listings$ = DOM.select('.appListingsButton').events('click').mapTo('listings')
  const messages$ = DOM.select('.appMessagesButton').events('click').mapTo('messages')
  const settings$ = DOM.select('.appSettingsButton').events('click').mapTo('settings')
  const calendar$ = DOM.select('.appCalendarButton').events('click').mapTo('calendar')
  const profile$ = DOM.select('.appProfileButton').events('click').mapTo('profile')
  const show_menu$ = DOM.select('.appShowMenuButton').events('click')
  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)

  return {
    page$: O.merge(
      listings$, messages$, settings$, calendar$, profile$
    ),
    show_menu$, 
    brand_button$
  }
}

function reducers(actions, inputs) {
  //const page_r = actions.page$.map(val => state => state.set('page', val))
  //return O.merge(page_r)
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      props$: inputs.props$ || O.of('profile')
    })
    .switchMap((info: any) => {
      const {props} = info
      const init = {
        page: props || 'profile'
      }
      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
} 

function view(state$) {
  return state$.map(state => {
    console.log('state', state)
    const {page} = state
    const listings_class = page === 'listings' ? '.selected' : '.not-selected'
    const messages_class = page === 'messages' ? '.selected' : '.not-selected'
    const settings_class = page === 'settings' ? '.selected' : '.not-selected'
    const calendar_class = page === 'calendar' ? '.selected' : '.not-selected'
    const profile_class = page === 'profile' ? '.selected' : '.not-selected'
    return div('.d-flex.fx-j-sb', [
      button('.appBrandButton.h-2.mw-2.hopscotch-icon.btn.btn-link.nav-brand', []),
      span('.user-navigator', [
        span(profile_class, [button('.hidden-md-up.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-user', [])])]),
        span(listings_class, [button('.hidden-md-up.btn.btn-link.appListingsButton.menu-item', [span('.fa.fa-microphone', [])])]),
        span(messages_class, [button('.hidden-md-up.btn.btn-link.appMessagesButton.menu-item', [span('.fa.fa-envelope', [])])]),
        span(settings_class, [button('.hidden-md-up.btn.btn-link.appSettingsButton.menu-item', [span('.fa.fa-gear', [])])]),
        //span(calendar_class, [button('.hidden-md-up.btn.btn-link.appCalendarButton.user-menu-item', [span('.fa.fa-calendar', [])])]),
        span(profile_class, [button('.hidden-sm-down.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-user.mr-xs', []), span('.fs-1', ['Profile'])])]),
        span(listings_class, [button('.hidden-sm-down.btn.btn-link.appListingsButton.menu-item', [span('.fa.fa-microphone.mr-xs', []), span('.fs-1', ['Listings'])])]),
        span(messages_class, [button('.hidden-sm-down.btn.btn-link.appMessagesButton.menu-item', [span('.fa.fa-envelope.mr-xs', []), span('.fs-1', ['Messages'])])]),
        span(settings_class, [button('.hidden-sm-down.btn.btn-link.appSettingsButton.menu-item', [span('.fa.fa-gear.mr-xs', []), span('.fs-1', ['Settings'])])]),
        //span(calendar_class, [button('.hidden-sm-down.btn.btn-link.appCalendarButton.user-menu-item', [span('.fa.fa-calendar.mr-xs', []), span('.fs-1', ['Calendar'])])]),
      ]),
      span('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.pt-25', [])
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
  const state$ = model(actions, {...inputs, props$: muxed_router.valid_path$})
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    Router: O.merge(
      muxed_router.invalid_path$.mapTo({
        type: 'replace',
        action: 'REPLACE',
        pathname: '/home'
      }),
      actions.page$.map(page => {
        const out = {
          type: 'replace',
          action: 'REPLACE',
          pathname: page === 'profile' ? '/home' : '/home/' + page
        }

        return out  
      })
    ),
    MessageBus: O.merge(
      actions.show_menu$.withLatestFrom(state$, (_, state) => ({
        to: `main`, message: {
          type: `showLeftMenu`, data: {
            redirect_url: state.page ? '/home' + state.page : '/home'
          }
        }
      }))
    ),
    output$: state$.pluck('page').distinctUntilChanged()
  }
}