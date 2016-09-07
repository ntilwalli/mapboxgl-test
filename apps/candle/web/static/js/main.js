import {Observable as O, Subject} from 'rxjs'
import Cycle from '@cycle/rxjs-run';
import {makeRouterDriver} from 'cyclic-router';
import storageDriver from '@cycle/storage'
import {createHistory} from 'history';
import {makeHTTPDriver} from '@cycle/http'
import makeGlobalDOMEventDriver from './localDrivers/globalDOM'
import {makeMapDOMDriver} from 'cycle-mapdom'

import {div, button, makeDOMDriver} from '@cycle/dom';
import isolate from '@cycle/isolate'

import {normalizeSink, normalizeComponent, blankComponentUndefinedDOM, defaultNever, combineObj, createProxy, spread} from './utils'

import startServices from './startServices'
import getModal from './getModal'
import route from './routing'
import intent from './intent'
import model from './model'
import view from './view'

import Menu from './library/menu/main'
import LeftMenuContent from './library/menu/left/main'
import Modal from './library/modal/simple/main'
import Login from './library/authorization/login/main'
import Signup from './library/authorization/signup/main'
import Presignup from './library/authorization/presignup/main'



function main(sources) {

  const toServicesMessage$ = createProxy()
  const hideModal$ = createProxy()

  const services = startServices(sources, {
    message$: toServicesMessage$
      .map(x => {
        return x
      }).cache(1)
    })

  const routedComponent = route(sources, services.outputs)
  const actions = intent(sources)
  const state$ = model(actions, spread(
    services.outputs, { 
    hideModal$
  }))

  const modal$ = state$.map(state => {
    return state.modal
  }).distinctUntilChanged()
    .map(modal => getModal(sources, services.outputs, modal))
    .cache(1)

  const components = {
    child$: routedComponent.DOM,
    modal$: normalizeSink(modal$, 'DOM')
  }

  const mergedMessage$ = O.merge(
    routedComponent.message$.map(x => {
      return x
    }),
    normalizeSink(modal$, 'message$')
  )
  
  toServicesMessage$.attach(mergedMessage$)
  hideModal$.attach(normalizeSink(modal$, 'close$'))

  return {
    DOM: view(state$, components),
    MapDOM: routedComponent.MapDOM,
    Router: O.merge(
      routedComponent.Router,
      normalizeSink(modal$, 'Router')//,
      // state$.map(state => state.modal)
      //   .distinctUntilChanged()
      //   .filter(x => x === null)
      //   .switchMap(() => sources.Router.history$.take(1).map(x => {
      //     return x.pathname
      //   }))
    ),
    Global: O.merge(
      routedComponent.Global,
      defaultNever(services, 'Global'),
      normalizeSink(modal$, 'Global')
    ),
    Storage: O.merge(
      routedComponent.Storage,
      defaultNever(services, 'Storage'),
      normalizeSink(modal$, 'Storage')
    ),
    HTTP: O.merge(
      routedComponent.HTTP,
      defaultNever(services, 'HTTP'),
      normalizeSink(modal$, 'HTTP')
    ).map(x => {
      return x
    }),
    Heartbeat: O.never()
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver(`#app-main`),
  MapDOM: makeMapDOMDriver(
    `pk.eyJ1IjoibXJyZWRlYXJzIiwiYSI6ImNpbHJsZnJ3NzA4dHZ1bGtub2hnbGVnbHkifQ.ph2UH9MoZtkVB0_RNBOXwA`),
  Router: makeRouterDriver(createHistory(), {capture: true}),
  Global: makeGlobalDOMEventDriver(),
  Storage: storageDriver,
  HTTP: makeHTTPDriver(),
  Heartbeat: () => {
    return O.interval(60000).map(() => new Date()).share()
  }
})