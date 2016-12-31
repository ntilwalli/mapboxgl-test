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
      props$: inputs.props$
    })
    .switchMap((info: any) => {
      return reducer$
        .startWith(Immutable.Map(info.props))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
} 

function view(state$) {
  return state$.map(state => {
    console.log('state', state)
    const {authorization, page, listing} = state
    const type = listing && listing.type
    const recurrences_class = page === 'recurrences' ? '.selected' : '.not-selected'
    const messages_class = page === 'messages' ? '.selected' : '.not-selected'
    const settings_class = page === 'settings' ? '.selected' : '.not-selected'
    const calendar_class = page === 'calendar' ? '.selected' : '.not-selected'
    const profile_class = page === 'profile' ? '.selected' : '.not-selected'
    return div('.user-navigator.d-flex.fx-j-sb', [
      button('.appBrandButton.h-2.hopscotch-icon.btn.btn-link.nav-brand', []),
      type === 'recurring' || authorization ? span([
        type === 'recurring' || authorization ? span(profile_class, [button('.hidden-md-up.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-user', [])])]) : null,
        type === 'recurring' ? span(recurrences_class, [button('.hidden-md-up.btn.btn-link.appRecurrencesButton.menu-item', [span('.fa.fa-microphone', [])])]) : null,
        authorization ? span(messages_class, [button('.hidden-md-up.btn.btn-link.appMessagesButton.menu-item', [span('.fa.fa-envelope', [])])]) : null,
        authorization ? span(settings_class, [button('.hidden-md-up.btn.btn-link.appSettingsButton.menu-item', [span('.fa.fa-gear', [])])]) : null,
        //span(calendar_class, [button('.hidden-md-up.btn.btn-link.appCalendarButton.menu-item', [span('.fa.fa-calendar', [])])]),
        type === 'recurring' || authorization ? span(profile_class, [button('.hidden-sm-down.btn.btn-link.appProfileButton.menu-item', [span('.fa.fa-user.mr-xs', []), span('.fs-1', ['Profile'])])]) : null,
        type === 'recurring' ? span(recurrences_class, [button('.hidden-sm-down.btn.btn-link.appRecurrencesButton.menu-item', [span('.fa.fa-microphone.mr-xs', []), span('.fs-1', ['Recurrences'])])]) : null,
        authorization ? span(messages_class, [button('.hidden-sm-down.btn.btn-link.appMessagesButton.menu-item', [span('.fa.fa-envelope.mr-xs', []), span('.fs-1', ['Messages'])])]) : null,
        authorization ? span(settings_class, [button('.hidden-sm-down.btn.btn-link.appSettingsButton.menu-item', [span('.fa.fa-gear.mr-xs', []), span('.fs-1', ['Settings'])])]) : null,
        //span(calendar_class, [button('.hidden-sm-down.btn.btn-link.appCalendarButton.menu-item', [span('.fa.fa-calendar.mr-xs', []), span('.fs-1', ['Calendar'])])]),
      ]) : null,
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