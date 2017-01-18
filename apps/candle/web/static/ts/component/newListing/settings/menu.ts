import {Observable as O} from 'rxjs'
import {div, ul, li, button} from '@cycle/dom'
import Immutable = require('immutable')

import {combineObj, processHTTP, createProxy} from '../../../utils'

const routes = [
  {pattern: /^\/meta$/, value: {type: 'success', data: 'meta'}},
  {pattern: /^\/where$/, value: {type: 'success', data: 'donde'}},
  {pattern: /^\/when$/, value: {type: 'success', data: 'cuando'}},
  {pattern: /^\/properties$/, value: {type: 'success', data: 'properties'}},
  {pattern: /^\/admin$/, value: {type: 'success', data: 'admin'}},
  {pattern: /^\/$/, value: {type: 'success', data: 'meta'}},
  {pattern: /.*/, value: {type: "error"}}
]

function intent(sources) {
  const {DOM} = sources

  const meta$ = DOM.select('.appMetaButton').events('click').mapTo('meta')
  const donde$ = DOM.select('.appDondeButton').events('click').mapTo('donde')
  const cuando$ = DOM.select('.appCuandoButton').events('click').mapTo('cuando')
  const properties$ = DOM.select('.appPropertiesButton').events('click').mapTo('properties')
  const admin$ = DOM.select('.appAdminButton').events('click').mapTo('admin')

  return {
    page$: O.merge(meta$, donde$, cuando$, properties$, admin$)
  }
}

function muxRouter(sources) {
  const {Router} = sources
  const route$ = Router.define(routes)
    .publishReplay(1).refCount()
  const valid_path$ = route$
    .filter(route => {
      return route.value.info.type === 'success'
    })
    .map(route => {
      return route.value.info.data
    })
    .publishReplay(1).refCount()
  const invalid_path$ = route$.filter(route => {
    return route.value.info.type === 'error'
  })
    .publishReplay(1).refCount()

  return {
    valid_path$,
    invalid_path$
  }
}

function view(state$) {
  return state$.map(state => {
    return ul('.d-flex.justify-content-around.list-unstyled', {
      style: {
        "border-width": "1px 0", 
        "border-style": "solid", 
        "border-color": "black", 
        "background-color": "#F7F7F7", 
        position: "fixed", 
        width: "100%", 
        height: "2rem", 
        top: "3rem", 
        "flex-flow": "1 1 auto",
        "margin-bottom": 0
      }}, [
      li([
        button('.appMetaButton.btn.btn-link.h-100', ['Meta'])
      ]),
      li([
        button('.appWhereButton.btn.btn-link.h-100', ['Where'])
      ]),
      li([
        button('.appWhenButton.btn.btn-link.h-100', ['When'])
      ]),
      li([
        button('.appPropertiesButton.btn.btn-link.h-100', ['Properties'])
      ]),
      li([
        button('.appAdminButton.btn.btn-link.h-100', ['Admin'])
      ])
    ])
  })
}


export default function main(sources, inputs) {
  const actions = intent(sources)
  const muxed_routes = muxRouter(sources)
  const {valid_path$, invalid_path$} = muxed_routes
  return {
    DOM: view(muxed_routes.valid_path$),
    Router: muxed_routes.invalid_path$.map(route => {
      return {
        pathname: sources.Router.createHref('/meta'),
        type: 'replace'
      }
    }),
    output$: valid_path$,
    next$: actions.page$
  }
}