import {Observable as O} from 'rxjs'
import Cycle from '@cycle/rxjs-run';
import {makeDOMDriver, div} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import makeGlobalDriver from './globalDriver'
import {makeRouterDriver} from 'cyclic-router';
import {createHistory} from 'history';
import storageDriver from '@cycle/storage'

// import {makeMapJSONDriver} from 'cycle-mapboxgl'
// import isolate from '@cycle/isolate'
import {normalizeComponent, spread} from './utils'

import routeFunction from './routeFunction'
import Preferences from  './component/preferences/main'
import OneDayCalendar from './component/calendar/oneDay/main'
import SmartTextInput from './library/smartTextInput'
import LeftMenuModal from './library/leftMenuModal'

import {createProxy} from './utils'


import getModal from './getModal'
import model from './model'
import view from './view'

function main(sources) {
  
  const preferences$ = Preferences(sources)
  const inputs = {preferences$, authorization$: O.of(undefined)}
  const out = OneDayCalendar(sources, inputs)

  const hideMenu$ = createProxy()

  const state$ = model({}, {showMenu$: out.showMenu$, hideMenu$})
  const modal$ = state$.map(state => getModal(state.modal, sources, inputs))
    .publishReplay(1).refCount()

  hideMenu$.attach(modal$.switchMap(m => m.close$))

  const components = {
    content$: out.DOM,
    modal$: modal$.switchMap(m => m.DOM)
  }
  const vtree$ = view(state$, components)
  return spread(normalizeComponent(out), {DOM: vtree$})
}

Cycle.run(main, {
  DOM: makeDOMDriver(`#app-main`),
  HTTP: makeHTTPDriver(),
  Router: makeRouterDriver(createHistory(), routeFunction, {capture: true}),
  Global: makeGlobalDriver(),
  Storage: storageDriver
})
