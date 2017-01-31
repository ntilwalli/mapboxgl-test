import {Observable as O} from 'rxjs'
import {div, ul, li, button} from '@cycle/dom'
import Immutable = require('immutable')

import {combineObj, processHTTP, createProxy} from '../../../utils'

const routes = [
  {pattern: /^\/basics$/, value: {type: 'success', data: 'basics'}},
  {pattern: /^\/advanced$/, value: {type: 'success', data: 'advanced'}},
  {pattern: /^\/admin$/, value: {type: 'success', data: 'admin'}},
  //{pattern: /^\/$/, value: {type: 'success', data: 'basics'}},
  {pattern: /.*/, value: {type: "error"}}
]

function intent(sources) {
  const {DOM} = sources

  const page$ = DOM.select('.appMenuButton').events('click').map(ev => ev.target.dataset.page)

  return {
    page$
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
        button('.appMenuButton.btn.btn-link.h-100', {attrs: {"data-page": "basics"}}, ['Basics'])
      ]),
      li([
        button('.appMenuButton.btn.btn-link.h-100', {attrs: {"data-page": "advanced"}}, ['Advanced'])
      ]),
      li([
        button('.appMenuButton.btn.btn-link.h-100', {attrs: {"data-page": "admin"}}, ['Admin'])
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
        pathname: sources.Router.createHref('/basics'),
        type: 'replace',
        state: route.location.state
      }
    }),
    output$: valid_path$,
    next$: actions.page$
  }
}