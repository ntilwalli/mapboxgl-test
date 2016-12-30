import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../utils'

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
    selected$: O.merge(
      listings$, messages$, settings$, calendar$, profile$
    ),
    show_menu$, 
    brand_button$
  }
}

function reducers(actions, inputs) {
  const selected_r = actions.selected$.map(val => state => state.set('selected', val))
  return O.merge(selected_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      props$: inputs.props$ || O.of('profile')
    })
    .switchMap((info: any) => {
      const {props} = info
      const init = {
        selected: props || 'profile'
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
    const {selected} = state
    const listings_class = selected === 'listings' ? '.selected' : '.not-selected'
    const messages_class = selected === 'messages' ? '.selected' : '.not-selected'
    const settings_class = selected === 'settings' ? '.selected' : '.not-selected'
    const calendar_class = selected === 'calendar' ? '.selected' : '.not-selected'
    const profile_class = selected === 'profile' ? '.selected' : '.not-selected'
    return div('.user-navigator.d-flex.fx-j-sb', [
      button('.appBrandButton.h-2.hopscotch-icon.btn.btn-link.nav-brand', []),
      span([
        span(profile_class, [button('.hidden-md-up.btn.btn-link.appProfileButton.user-menu-item', [span('.fa.fa-user', [])])]),
        span(listings_class, [button('.hidden-md-up.btn.btn-link.appListingsButton.user-menu-item', [span('.fa.fa-microphone', [])])]),
        span(messages_class, [button('.hidden-md-up.btn.btn-link.appMessagesButton.user-menu-item', [span('.fa.fa-envelope', [])])]),
        span(settings_class, [button('.hidden-md-up.btn.btn-link.appSettingsButton.user-menu-item', [span('.fa.fa-gear', [])])]),
        //span(calendar_class, [button('.hidden-md-up.btn.btn-link.appCalendarButton.user-menu-item', [span('.fa.fa-calendar', [])])]),
        span(profile_class, [button('.hidden-sm-down.btn.btn-link.appProfileButton.user-menu-item', [span('.fa.fa-user.mr-xs', []), span('.fs-1', ['Profile'])])]),
        span(listings_class, [button('.hidden-sm-down.btn.btn-link.appListingsButton.user-menu-item', [span('.fa.fa-microphone.mr-xs', []), span('.fs-1', ['Listings'])])]),
        span(messages_class, [button('.hidden-sm-down.btn.btn-link.appMessagesButton.user-menu-item', [span('.fa.fa-envelope.mr-xs', []), span('.fs-1', ['Messages'])])]),
        span(settings_class, [button('.hidden-sm-down.btn.btn-link.appSettingsButton.user-menu-item', [span('.fa.fa-gear.mr-xs', []), span('.fs-1', ['Settings'])])]),
        //span(calendar_class, [button('.hidden-sm-down.btn.btn-link.appCalendarButton.user-menu-item', [span('.fa.fa-calendar.mr-xs', []), span('.fs-1', ['Calendar'])])]),
      ]),
      span('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.pt-25', [])
    ])
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    Router: actions.brand_button$.mapTo('/'),
    MessageBus: O.merge(
      actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`}),
    ),
    output$: state$.pluck('selected')
  }
}