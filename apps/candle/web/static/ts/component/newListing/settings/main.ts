import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong, pre, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP, PositionToRegion} from '../../../utils'
import {inflateListing, inflateSession, listingToSession} from '../../helpers/listing/utils'

import Menu from './menu'

function NotImplemented(sources, inputs) {
  return {
    DOM: O.of(div('.not-implemented.container', ['Not implemented'])),
    output$: O.never()
  }
}

const routes = [
  {pattern: /^\/meta$/, value: {type: 'success', data: 'meta'}},
  {pattern: /^\/where$/, value: {type: 'success', data: 'donde'}},
  {pattern: /^\/when$/, value: {type: 'success', data: 'cuando'}},
  {pattern: /^\/properties$/, value: {type: 'success', data: 'properties'}},
  {pattern: /^\/admin$/, value: {type: 'success', data: 'admin'}},
  {pattern: /^\/$/, value: {type: 'success', data: 'meta'}},
  {pattern: /.*/, value: {type: "error"}}
]

function drillInflate(result) {
  // console.log(result)
  result.listing = inflateListing(result.listing)
  result.children.map(inflateListing)
  return result
}

function view(components) {
  return combineObj({
    state$: O.of(undefined),
    components$: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    const {navigator, content} = components
    return div('listing-settings', [
      navigator,
      div('.container', {style: {"margin-top": "5rem"}}, [
        content
      ])
    ])
  })
}

export default function main(sources, inputs) {
  const navigator = isolate(Menu)(sources, inputs)

  const content$ = combineObj({
    page$: navigator.output$,
    session$: inputs.session$
  })
    .map((info: any) => {
      const {page, session} = info
      return NotImplemented(sources, inputs)
    }).publishReplay(1).refCount()
  
  const content = componentify(content$)

  const components = {
    navigator: navigator.DOM,
    content: content.DOM
  }

  const merged = mergeSinks(navigator, content)
  return {
    ...merged,
    DOM: view(components),
    Router: navigator.next$
      .withLatestFrom(content$.switchMap(x => x.output$), (page, session: any) => {
        return {
          pathname: sources.Router.createHref('/' + page),
          state: session.listing,
          type: 'push'
        }
      })
  }
}