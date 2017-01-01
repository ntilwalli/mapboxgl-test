import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, nav, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, createProxy, traceStartStop, processHTTP, componentify} from '../../utils'

//import BasicNav from './basicNav'
import AdminNav from './adminNav'
import ListingProfile from './profile/main'
import TimeoutLoader from '../../library/timeoutLoader'
import WTF from '../../library/wtf'
import ListingNotFound from '../../library/listingNotFound'

import {inflateListing} from '../helpers/listing/utils'

const routes = [
  {pattern: /^\/\d*$/, value: {type: "success"}},
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

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      const {navigator, content} = components
      return div(`.screen.listing-profile`, [
        nav('.navbar.navbar-light.bg-faded.container-fluid.pos-f-t.navigator', [
          navigator
        ]),
        content
      ])
    })
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
  const listing_id$ = route$.filter(route => route.value.info.type === 'success')
    .publishReplay(1).refCount()
  const listing_result_from_router$ = listing_id$.filter(route => route.location.state)
    .do(x => {
      console.log('result from router', x)
    })
    .publishReplay(1).refCount()
  const li_wo_push_state$ = listing_id$.filter(route => !route.location.state)
  const retrieve_listing_id$ = li_wo_push_state$
    .map(route => parseInt(route.path.substring(1)))
    .publishReplay(1).refCount()
  const no_listing_id$ = route$.filter(route => route.value.info.type === 'error')
    .publishReplay(1).refCount()

  return {
    listing_result_from_router$,
    retrieve_listing_id$,
    no_listing_id$
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

function reducers(actions, inputs) {
  const page_r = O.merge(
    inputs.page$,
  inputs.listing_result_not_found$.mapTo('listing_not_found').do(x => console.log('got here'))
  ).map(page => state => {
    return state.set('page', page)
  })

  const listing_result_r = O.merge(
      inputs.listing_result_from_http$, 
      inputs.listing_result_from_router$
    ).map(result => state => {
      return state.set('listing_result', result)
    })

  return O.merge(listing_result_r, page_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      authorization: inputs.Authorization.status$
    }).map((info: any) => {
      const init = {
        authorization: info.authorization,
        listing_result: undefined,
        page: 'profile'
      }

      return Immutable.Map(init)
    }).switchMap((init: any) => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

export default function main(sources, inputs): any {

  const {Router} = sources
  //const actions = intent(sources)

  const muxed_router = muxRouter(sources)
  const muxed_http = muxHTTP(sources)

  const page$ = createProxy()
  const state$ = model({}, {
    ...inputs,
    listing_result_from_http$: muxed_http.listing_result_from_http$,
    listing_result_from_router$: muxed_router.listing_result_from_router$,
    listing_result_not_found$: muxed_http.listing_result_error_from_http$,
    page$
  })

  const navigator = isolate(AdminNav)(sources, {
    ...inputs, 
    props$: state$.distinctUntilChanged((x, y) => x.listing !== y.listing)
  })
  
  page$.attach(navigator.output$)

  const content$ = state$
    .map((state: any) => {
      if (state.listing_result) {
        if (!state.page || state.page === 'profile') {
          const out = ListingProfile(sources, {...inputs, props$: O.of(state.listing_result)})
          return out
        } else {
          return NotImplemented(sources, inputs)
        }
      } else if (state.page === 'listing_not_found') {
        return ListingNotFound(sources, inputs)
      } else {
        return TimeoutLoader(sources, inputs)
      }
    }).publishReplay(1).refCount()

  const content = componentify(content$)
  const components = {
    navigator$: navigator.DOM,
    content$: content.DOM
  }

  const vtree$ = view(state$, components)

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
    .do(x => console.log(`retrieve listing toHTTP`, x))

  const merged = mergeSinks(navigator, content)

  return {
    ...merged,
    DOM: vtree$,
    Router: O.merge(
      merged.Router,
      muxed_router.no_listing_id$.mapTo({
          type: 'replace',
          action: 'REPLACE',
          path: '/'
        })
    ),
    HTTP: O.merge(
      merged.Router,
      to_http$
    )
  }
}