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
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const push_state$ = route$
    .filter(route => !!route.state)
    .map(route => route.state)
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const no_push_state$ = route$ 
    .filter(route => !route.state)
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const without_session$ = push_state$
    .filter(push_state => {
      return !push_state.session
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  
  const with_session$ = push_state$
    .filter(push_state => !!push_state.session)
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()


  return {
    with_session$,
    without_session$
  }
}

export default function main(sources, inputs) {
  const muxed_routes = muxRouter(sources)

  const position_to_region = PositionToRegion(sources, {
    ...inputs, 
    position$: muxed_routes.without_session$
      .map(listing_result => {
        return listing_result.listing.donde.lng_lat
      })
    })

  const search_area$ = position_to_region.output$.map(region => {
    return {
      region,
      radius: 10000
    }
  })

  const enriched_result_with_session$ = search_area$
    .withLatestFrom(muxed_routes.without_session$, ((search_area: any, listing_result: any) => {
      const listing = inflateListing(listing_result.listing)
      const session = listingToSession(listing, search_area)
      return {
        ...listing_result,
        listing,
        session
      }
    }))

  const full_listing_result$ = O.merge(
    muxed_routes.with_session$.map(listing_result => {
      const out = {
        ...listing_result, 
        listing: inflateListing(listing_result.listing), 
        session: inflateSession(listing_result.session)
      }

      return out
    }),
    enriched_result_with_session$
  )

  const content$ = full_listing_result$
    .startWith(undefined)
    .map(listing_result => {
      if (listing_result) {
        return Content(sources, {...inputs, listing_result$: O.of(listing_result)})
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