import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong, pre, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP, PositionToRegion} from '../../../utils'
import {inflateListing, inflateSession, listingToSession} from '../../helpers/listing/utils'

import Menu from './menu'
import Basics from '../../create/newListing/basics/outputMain'

function NotImplemented(sources, inputs) {
  return {
    DOM: O.of(div('.not-implemented.container', ['Not implemented'])),
    output$: O.never()
  }
}

const routes = [
  {pattern: /^\/basics$/, value: {type: 'success', data: 'basics'}},
  {pattern: /^\/advanced$/, value: {type: 'success', data: 'advanced'}},
  {pattern: /^\/admin$/, value: {type: 'success', data: 'admin'}},
  {pattern: /.*/, value: {type: "error"}}
]

function drillInflate(result) {
  // console.log(result)
  result.listing = inflateListing(result.listing)
  result.children.map(inflateListing)
  return result
}

function view(components) {
  return combineObj(components)
    .map((components: any) => {
      const {navigator, content} = components
      return div('listing-settings', [
        navigator,
        div('.container', {style: {"margin-top": "5rem"}}, [
          content
        ])
      ])
    })
}

function reducers(actions, inputs) {
  const updated_session_r = inputs.updated_session$.map(session => state => state.set('session', session))
  return O.merge(updated_session_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    session$: inputs.session$,
  }).take(1)
    .switchMap((info: any) => {
      const {session} = info
      return reducer$.startWith(Immutable.fromJS(info))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .do(x => {
      console.log('listing/settings/main', x)
    })
    .publishReplay(1).refCount()
}

export default function main(sources, inputs) {
  const navigator = isolate(Menu)(sources, inputs)
  const content$ = navigator.output$
    .map((page: any) => {
      if (page === 'basics') {
        return Basics(sources, {...inputs, show_errors$: O.of(true)})
      } else {
        return NotImplemented(sources, inputs)
      }
    }).publishReplay(1).refCount()

  const content = componentify(content$)
  // //const state$ = model({}, {...inputs, updated_session$: content.output$})

  const components = {
    navigator: navigator.DOM
      .map(x => {
        return x
      }),
    content: content.DOM
      .map(x => {
        return x
      })
  }

  const to_http$ = O.never()

  const merged = mergeSinks(navigator)
  return {
    ...merged,
    DOM: view(components),
    // //HTTP: to_http$,
    Router: O.merge(
      merged.Router,
      navigator.next$
        .withLatestFrom(inputs.session$, (page, session: any) => {
          return {
            pathname: sources.Router.createHref('/' + page),
            state: session,
            type: 'push'
          }
        })
    )
  }
}