import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong, pre, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP, PositionToRegion} from '../../../utils'
import {inflateListing, inflateSession, listingToSession} from '../../helpers/listing/utils'

import Content from './main'

function NotImplemented(sources, inputs) {
  return {
    DOM: O.of(div('.not-implemented.container', ['Not implemented'])),
    output$: O.never()
  }
}

function muxRouter(sources) {
  const {Router} = sources
  const route$ = Router.history$
    .publishReplay(1).refCount()

  const push_state$ = route$
    .filter(route => !!route.state)
    .map(route => route.state)
    .publishReplay(1).refCount()

  const no_push_state$ = route$ 
    .filter(route => !route.state)
    .publishReplay(1).refCount()

  const listing$ = push_state$
    .filter(push_state => {
      return !!push_state.children
    })
    .map(listing_result => {
      return listing_result.listing
    })
    .map(inflateListing)
    .publishReplay(1).refCount()
  
  const session$ = push_state$
    .filter(push_state => !!push_state.properties)
    .map(x => {
      return x
    })
    .map(inflateSession)
    .publishReplay(1).refCount()


  return {
    listing$,
    session$
  }
}

export default function main(sources, inputs) {
  const muxed_routes = muxRouter(sources)

  const position_to_region = PositionToRegion(sources, {
    ...inputs, 
    position$: muxed_routes.listing$
      .map(x => {
        return x.donde.lng_lat
      })
    })

  const search_area$ = position_to_region.output$.map(region => {
    return {
      region,
      radius: 10000
    }
  })

  const listing_to_session$ = combineObj({
    search_area$,
    listing$: muxed_routes.listing$
  }).map((info: any) => {
    const {search_area, listing} = info
    const session = listingToSession(listing, search_area)
    return session
  })

  const session$ = O.merge(
    muxed_routes.session$.map(inflateSession),
    muxed_routes.listing$.switchMap(_ => listing_to_session$.startWith(undefined))
  )

  const content$ = session$
    .map(session => {
      if (session) {
        return Content(sources, {...inputs, session$: O.of(session)})
      } else {
        return {
          DOM: O.of(div(`.screen`, [
            div('.loader-container.nav-fixed-offset', [
              div('.loader', [])
            ])
          ]))
        }
      }
    }).publishReplay(1).refCount()
  
  const content = componentify(content$)
  const merged = mergeSinks(position_to_region, content)
  return {
    ...merged,
    DOM: content.DOM
  }
}