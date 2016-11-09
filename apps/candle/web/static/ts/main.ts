import {Observable as O} from 'rxjs'
import Cycle from '@cycle/rxjs-run'
import {makeDOMDriver, div} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import makeGlobalDriver from './globalDriver'
import {makeRouterDriver} from 'cyclic-router'
import {createHistory} from 'history';
import storageDriver from '@cycle/storage'
import isolate from '@cycle/isolate'
import queryString = require('query-string')

// import {makeMapJSONDriver} from 'cycle-mapboxgl'
// import isolate from '@cycle/isolate'
import {normalizeComponent, createProxy, spread} from './utils'

import routeFunction from './routeFunction'
import PreferencesService from  './service/preferences'
import AuthorizationService from './service/authorization/main'
import GeolocationService from './service/geolocation'
import OneDayCalendar from './component/calendar/oneDay/main'
import SmartTextInput from './library/smartTextInput'
import LeftMenuModal from './library/leftMenuModal'

import getModal from './getModal'
import intent from './intent'
import model from './model'
import view from './view'


import messageBusify from './messageBusify'


function main(sources) {
  
  // Keep a persistent subscriber for Global.geolocation$
  // to maintain validity
  sources.Global.geolocation$.subscribe()

  const preferences$ = PreferencesService(sources)
  const authService = AuthorizationService(sources)
  const geoService = GeolocationService(sources)

  const inputs = {
    preferences$: preferences$.output$, 
    Authorization: authService.output,
    Geolocation: geoService.output
  }
  const out = normalizeComponent(OneDayCalendar(sources, inputs))

  const actions = intent(sources)
  const showMenu$ = sources.MessageBus.address(`main`).filter(x => x === `showLeftMenu`)
    .mapTo(`leftMenu`)
  const showLogin$ = sources.MessageBus.address(`main`).filter(x => x === `showLogin`)
    .mapTo(`login`)
  const showSignup$ = sources.MessageBus.address(`main`).filter(x => x === `showSignup`)
    .mapTo(`signup`)
    
  const showModal$ = O.merge(actions.modal$, showMenu$, showLogin$, showSignup$)
  const hideModal$ = sources.MessageBus.address(`main`).filter(x => x === `hideModal`)

  const state$ = model(actions, {showModal$, hideModal$})
  const modal$ = state$.map((state: any) => getModal(state.modal, sources, inputs))
    .map(normalizeComponent)
    .publishReplay(1).refCount()

  const components = {
    content$: out.DOM,
    modal$: modal$.switchMap(m => m.DOM)
  }
  const vtree$ = view(state$, components)

  const toRouter$ = state$.pluck(`modal`)
    .distinctUntilChanged()
    .filter(x => !x)
    .switchMap(_ => {
      return actions.urlParams$
        .filter(x => !!x.modal)
        .map(x => {
          // Hacky any to be handled later...
          // From here: http://stackoverflow.com/questions/35959372/property-assign-does-not-exist-on-type-objectconstructor
          const params = (<any>Object).assign({}, x)
          delete params.modal
          const out = queryString.stringify(params)
          if (out && out.length > 0) {
            return `?${out}`
          } else {
            return '/'
          }
        })
    })

  const fromModalHTTP = modal$.switchMap(x => x.HTTP)
  const fromModalGlobal = modal$.switchMap(x => x.Global)
  const fromModalRouter = modal$.switchMap(x => x.Router)
  const fromModalStorage = modal$.switchMap(x => x.Storage)
  const fromModalMessageBus = modal$.switchMap(x => x.MessageBus)

  return spread(out, {
    DOM: vtree$,
    Global: O.merge(out.Global, authService.Global, fromModalGlobal),
    HTTP: O.merge(out.HTTP, geoService.HTTP, authService.HTTP, fromModalHTTP),
    Router: O.merge(out.Router, toRouter$, fromModalRouter),
    Storage: O.merge(out.Storage, geoService.Storage, fromModalStorage),
    MessageBus: O.merge(out.MessageBus, authService.MessageBus, fromModalMessageBus)
  })
}

const wrappedMain = messageBusify(main)

Cycle.run(wrappedMain, {
  DOM: makeDOMDriver(`#app-main`),
  HTTP: makeHTTPDriver(),
  Router: makeRouterDriver(createHistory(), routeFunction, {capture: true}),
  Global: makeGlobalDriver(),
  Storage: storageDriver
})