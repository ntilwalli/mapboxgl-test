import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong, pre, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP} from '../../../utils'
import {inflateListing, inflateSession} from '../../helpers/listing/utils'

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

function intent(sources) {
  const {DOM, Phoenix} = sources
  console.log('Phoenix', Phoenix)
  const notifications$ = Phoenix.Channels.select('user:39').on('notifications')
  return {
    notifications$
  }
}

function reducers(actions, inputs) {
  const session_r = inputs.session$.skip(1)
    .map(session => state => {
      return state.set('session',Immutable.fromJS(session)).set('waiting', false)
    })

  return O.merge(session_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.session$.take(1)
    .map(session => {
      return {
        session,
        waiting: true
      }
    })
    .map(x => Immutable.fromJS(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}


function toSession(listing) {
  return listing
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

function muxRouter(sources) {
  const {Router} = sources
  const route$ = Router.define(routes)
    .publishReplay(1).refCount()
  const success$ = route$.filter(route => {
    return route.value.info.type === 'success'
  })
    .publishReplay(1).refCount()
  const listing$ = success$
    .filter(route => !!route.location.state)
    .map(route => {
      return route.location.state
    })
    .publishReplay(1).refCount()

  return {
    listing_result_from_router$: listing$.map(drillInflate),
  }
}

export default function main(sources, inputs) {
  const muxed_routes = muxRouter(sources)
  const navigator = isolate(Menu)(sources, inputs)

  const session$ = O.merge(
    muxed_routes.listing_result_from_router$
      .map(listing => {
        return toSession(listing)
      }),
    O.never()
  )

  const state$ = model(sources, {...inputs, session$})

  const content$ = navigator.output$
    .map(page => {
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



// export default function main(sources, inputs) {
//   const muxed_routes = muxRouter(sources)

//   const content$ = muxed_routes.listing_result_from_router$.map(result => {
//     const navigator = isolate(Menu)(sources, inputs)

//     const content$ = navigator.output$
//       .map(page => {
//         return NotImplemented(sources, inputs)
//       }).publishReplay(1).refCount()
    
//     const content = componentify(content$)

//     const components = {
//       navigator: navigator.DOM,
//       content: content.DOM
//     }

//     const merged = mergeSinks(navigator, content)
//     return {
//       ...merged,
//       DOM: view(components)
//     }
//   }).publishReplay(1).refCount()

//   const content = componentify(content$)

//   return content
// }