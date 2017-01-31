import {Observable as O} from 'rxjs'
import Cycle from '@cycle/rxjs-run'
import {makeDOMDriver, div} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import makeGlobalDriver from './globalDriver'
import {makeRouterDriver} from 'cyclic-router'
import * as History from 'history';
import storageDriver from '@cycle/storage'
import {makeMapJSONDriver} from 'cycle-mapboxgl'
import makePhoenixDriver from './phoenixDriver'
//import isolate from '@cycle/isolate'
import queryString = require('query-string')



import {normalizeComponent, createProxy, traceStartStop, componentify} from './utils'

import routeFunction from './routeFunction'
import SettingsService from  './service/settings'
import AuthorizationService from './service/authorization/main'
import GeolocationService from './service/geolocation'
// import SearchApp from './component/search/oneDay/main'
// import SmartTextInput from './library/smartTextInput'
// import LeftMenuModal from './library/leftMenuModal'

import getModal from './getModal'
import intent from './intent'
import model from './model'
import view from './view'
import routing from './routing'


import messageBusify from './messageBusify'


function main(sources) {
  
  // Keep a persistent subscriber for Global.geolocation$
  // to maintain validity
  sources.Global.geolocation$.subscribe()

  const authorizationService = AuthorizationService(sources)
  const settingsService = SettingsService(sources, {authorization$: authorizationService.output.status$})
  settingsService.output$.subscribe()
  const geoService = GeolocationService(sources)

  const inputs = {
    settings$: settingsService.output$, 
    Authorization: authorizationService.output,
    Geolocation: geoService.output
  }

  inputs.Authorization.status$.subscribe()
  
  //const out = normalizeComponent(OneDayCalendar(sources, inputs))
  const out = routing(sources, inputs)

  const actions = intent(sources)
  const state$ = model(actions, {})
  const modal$ = state$.map((state: any) => getModal(state.modal, sources, inputs))
    .publishReplay(1).refCount()

  const modal = componentify(modal$)

  const components = {
    content$: out.DOM,
    modal$: modal.DOM
  }
  const vtree$ = view(state$, components)

  const toRouter$ = state$.pluck(`modal`)
    .distinctUntilChanged()
    .filter(x => !x)
    .switchMap(_ => {
      return actions.url_params$
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

  //out.MessageBus.subscribe(x => console.log(`toMessageBus root:`, x))

  return {
    ...out,
    DOM: vtree$,
    MapJSON: O.merge(out.MapJSON),
    Global: O.merge(out.Global, authorizationService.Global, modal.Global),
    HTTP: O.merge(
        out.HTTP, 
        settingsService.HTTP, 
        geoService.HTTP, 
        authorizationService.HTTP, 
        modal.HTTP
      )
      .do(x => {
        console.log(`main/http sink`, x)
      }),
    Router: O.merge(out.Router, toRouter$, modal.Router)
      .do(x => {
        console.log(`main/router sink`, x)
      })
      .delay(1),  // This is IMPORTANT in the case of double Routing, HTTP stream gets cut off without this for some reason, this ensures route is pushed on next event loop turn
    Storage: O.merge(out.Storage, settingsService.Storage, geoService.Storage, modal.Storage),
    Phoenix: O.merge(out.Phoenix),
    MessageBus: O.merge(
      out.MessageBus, 
      settingsService.MessageBus,
      authorizationService.MessageBus, 
      modal.MessageBus
    )
    //.letBind(traceStartStop(`main MessageBus trace`)), 
  }
}
const wrappedMain = messageBusify(main)

Cycle.run(wrappedMain, {
  DOM: makeDOMDriver(`#app-main`),
  MapJSON: makeMapJSONDriver(
    `pk.eyJ1IjoibXJyZWRlYXJzIiwiYSI6ImNpbHJsZnJ3NzA4dHZ1bGtub2hnbGVnbHkifQ.ph2UH9MoZtkVB0_RNBOXwA`),
  HTTP: makeHTTPDriver(),
  Router: makeRouterDriver(History.createHistory() as any, routeFunction, {capture: true}),
  Global: makeGlobalDriver(),
  Storage: storageDriver,
  Phoenix: makePhoenixDriver()
})
