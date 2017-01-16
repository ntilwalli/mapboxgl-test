import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, nav, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, createProxy, traceStartStop, processHTTP, componentify} from '../../utils'

//import BasicNav from './basicNav'
//import AdminNav from './adminNav'
import AdminNav from '../../library/navigators/listing'
import ListingProfile from './profile/main'
import Notifications from './notifications/main'
import TimeoutLoader from '../../library/timeoutLoader'
import WTF from '../../library/wtf'
import ListingNotFound from '../../library/listingNotFound'

import {inflateListing} from '../helpers/listing/utils'

const routes = [
  {pattern: /^\/(\d+)/, value: {type: "success"}},
  {pattern: /^\/notFound$/, value: {type: "error"}},
  {pattern: /.*/, value: {type: "error"}}
]

function NotImplemented(sources, inputs) {
  return {
    DOM: O.of(div('.not-implemented.container.nav-fixed-offset', ['Not implemented']))
  }
}

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function drillInflate(result) {
  // console.log(result)
  result.listing = inflateListing(result.listing)
  result.children.map(inflateListing)
  return result
}

function view(components, active$) {
  return combineObj({
    components: combineObj(components),
    active$
  }).debounceTime(0)
    .map((info: any) => {
      const {components, active} = info
      const {navigator, content} = components
      return div(`.screen.listing-profile`, [
        nav('.navbar.navbar-light.bg-faded.container-fluid.fixed-top.navigator', [
          navigator
        ]),
        div({class: {"translate-down": active}}, [
          content
        ])
      ])
    })
}

function reducers(actions, inputs) {
  // const page_r = O.merge(
  //   inputs.page$,
  // inputs.listing_result_not_found$.mapTo('listing_not_found').do(x => console.log('got here'))
  // ).map(page => state => {
  //   return state.set('page', page)
  // })

  const listing_result_r = inputs.listing_result_from_http$
    .map(result => state => {
      return state.set('listing_result', result)
    })

  return O.merge(listing_result_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      listing_result$: inputs.props$,
    }).map((init: any) => {
      return Immutable.Map(init)
    }).switchMap((init: any) => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

// Check if listing id given in route. If no, check if pushState has listing,
// if yes, reroute to path with associated listing id, else show wtf screen, 
// if yes, check if push state has listing, if yes, store and load listing screen
// if no, retrieve from cloud and show waiting screen, once retrieved, success ? route
// with proper listing id and push state, error ? route to listing not found screen
function muxRouter(sources) {
  const {Router} = sources
  const route$ = Router.define(routes)
    .publishReplay(1).refCount()
  const success$ = route$.filter(route => route.value.info.type === 'success')
    // .do(route => {
    //   console.log('success route', route)
    // })
    .publishReplay(1).refCount()
  const listing$ = success$
    .filter(route => !!route.location.state)
    .map(route => route.location.state)
    // .do(x => {
    //   console.log('result from router', x)
    // })
    .publishReplay(1).refCount()
  const li_wo_push_state$ = success$.filter(route => !route.location.state)
  const retrieve_listing_id$ = li_wo_push_state$
    .map(route => parseInt(route.value.match[1]))
    .publishReplay(1).refCount()
  const no_listing_id$ = route$.filter(route => {
      return route.value.info.type === 'error'
    })
    .publishReplay(1).refCount()

  return {
    listing_result_from_router$: listing$.map(drillInflate),
    retrieve_listing_id$,
    no_listing_id$,
    route$
  }
}

function muxHTTP(sources) {
  const {HTTP} = sources
  const {success$, error$, good$, bad$, ugly$} = processHTTP(sources, `getListingById`)

  return {
    listing_result_from_http$: success$.map(drillInflate),
    listing_result_error_from_http$: error$
  }
}

//function toComponent(sources, inputs)

export default function main(sources, inputs): any {

  const {Router} = sources
  const muxed_router = muxRouter(sources)
  const muxed_http = muxHTTP(sources)

  const component$ = O.merge(
    muxed_router.retrieve_listing_id$.map(_ => TimeoutLoader(sources, inputs)),
    muxed_router.listing_result_from_router$.map(result => {
      const navigator = isolate(AdminNav)({...sources, Router: sources.Router.path(result.listing.id.toString())}, {
        ...inputs, 
        props$: O.of(result)
      })

      const content$ = navigator.output$
        .map(page => {
          if (!page || page === 'profile') {
            const out = ListingProfile(sources, {...inputs, props$: O.of(result)})
            return out
          } else if (!page || page === 'notifications') {
            const out = Notifications(sources, inputs)
            return out
          } else {
            return NotImplemented(sources, inputs)
          }
        }).publishReplay(1).refCount()
      
      const content = componentify(content$)

      const components = {
        navigator: navigator.DOM,
        content: content.DOM
      }

      const merged = mergeSinks(navigator, content)
      return {
        ...merged,
        DOM: view(components, navigator.active$)
      }
    })
  ).publishReplay(1).refCount()

  const component = componentify(component$)

  const to_http$ = muxed_router.retrieve_listing_id$
    .map(listing_id => {
      return {
          url: `/api/user`,
          method: `post`,
          send: {
            route: "/retrieve_listing",
            data: listing_id
          },
          category: `getListingById`
      }
    })
    //.do(x => console.log(`retrieve listing toHTTP`, x))

  return {
    ...component,
    Router: O.merge(
      component.Router.map(x => {
        return x
      }),
      combineObj({
        route: muxed_router.route$, 
        result: muxed_http.listing_result_from_http$
      }).map((info: any) => {
        const {route, result} = info
        return {
          type: 'replace',
          action: 'REPLACE',
          pathname: route.location.pathname,
          state: result
        }
      }),
      muxed_router.no_listing_id$.map(x => {
        return {
          type: 'replace',
          action: 'REPLACE',
          pathname: '/'
        }
      })
    ).map(x => {
      return x
    }),
    HTTP: O.merge(
      component.HTTP,
      to_http$
    )
  }
}