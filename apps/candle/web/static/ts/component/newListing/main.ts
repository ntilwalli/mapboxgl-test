import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, nav, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, createProxy, traceStartStop, processHTTP, componentify, universalAuth} from '../../utils'

import Navigator from '../../library/navigators/listing'
import ListingProfile from './profile/main'
import Settings from './settings/parentMain'
import Notifications from './notifications/main'
import Calendar from './calendar/newMain'
import TimeoutLoader from '../../library/timeoutLoader'
import WTF from '../../library/wtf'
import ListingNotFound from '../../library/listingNotFound'

import {inflateListing, inflateSession} from '../helpers/listing/utils'
import {ReleaseTypes, VisibilityTypes} from '../../listingTypes'

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
        navigator,
        div({style: {"padding-top": active ? "6rem" : "0"}}, [
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
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const yes_listing_id$ = route$.filter(route => {
      return route.value.info.type === 'success'
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()


  const no_listing_id$ = route$.filter(route => {
      return route.value.info.type === 'error'
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const push_state$ = yes_listing_id$
    .filter(route => !!route.location.state)
    .map(route => route.location.state)
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const no_push_state$ = yes_listing_id$
    .filter(route => !route.location.state)
    .map(x => {
      return x
    })

  const listing_result$ = push_state$
    .map(drillInflate)
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const li_wo_push_state$ = yes_listing_id$.filter(route => {
      return !route.location.state
    })
    .map(x => {
      return x
    })

  const retrieve_listing_id$ = no_push_state$
    .map(route => parseInt(route.value.match[1]))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  return {
    listing_result$,
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

function isValid({page, authorization, listing_result}) {
  const type = listing_result.listing.donde.type
  const listing_user = listing_result.listing.user_id
  if (page === 'profile' || page === 'calendar') {
    return true
  } else {
    const {id, username} = authorization
    if (authorization && (listing_user === id || username === 'tiger' || username === 'nikhil') && type !== 'badslava') {
      return true
    } else {
      return false
    }
  }
}

function isAuthorized(auth, listing) {
  if (auth && listing.user_id === auth.id) {
    return true
  } else {
    if (listing.visibility === VisibilityTypes.PUBLIC) {
      if (listing.release !== ReleaseTypes.STAGED) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }
}

function fromListingResult(sources, inputs, result: any) {
  const router_with_listing_id = sources.Router.path(result.listing.id.toString())
  const navigator = isolate(Navigator)({...sources, Router: router_with_listing_id}, {
    ...inputs, 
    props$: O.of(result)
  })

  const state$ = combineObj({
    page$: navigator.output$.take(1),
    authorization$: inputs.Authorization.status$,
    listing_result$: O.of(result)
  }).publishReplay(1).refCount()

  const valid_state$ = state$.filter((x: any) => isValid(x))
    .map((x: any) => {
      return x.page
    })
  const invalid_state$ = state$.filter((x: any) => !isValid(x))
    .map(x => {
      return x
    })

  const authorized$ = inputs.Authorization.status$.filter(auth => isAuthorized(auth, result.listing))
  const not_authorized$ = inputs.Authorization.status$.filter(auth => !isAuthorized(auth, result.listing))

  const content$ = authorized$
    .switchMap(_ => valid_state$)
    .map((page: any) => {
      if (!page || page === 'profile') {
        const out = ListingProfile({...sources, Router: router_with_listing_id.path(page)}, {...inputs, props$: O.of(result), menu_active$: navigator.active$})
        return out
      } else if (!page || page === 'notifications') {
        const out = Notifications({...sources, Router: router_with_listing_id.path(page)}, {...inputs, props$: O.of(result), menu_active$: navigator.active$})
        return out
      } else if (!page || page === 'calendar') {
        const out = Calendar({...sources, Router: router_with_listing_id.path(page)}, {...inputs, props$: O.of(result), menu_active$: navigator.active$})
        return out
      } else if (!page || page === 'settings') {
        const out = Settings({...sources, Router: router_with_listing_id.path(page)}, {...inputs, props$: O.of(result), menu_active$: navigator.active$})
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
    DOM: view(components, navigator.active$), 
    redirect$: invalid_state$,
    next$: navigator.output$.skip(1),
    not_authorized$
  }
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const muxed_router: any = muxRouter(sources)
  const muxed_http = muxHTTP(sources)

  const component$ = O.merge(
    muxed_router.retrieve_listing_id$.map(_ => TimeoutLoader(sources, inputs)),
    muxed_router.listing_result$.map((result: any) => fromListingResult(sources, inputs, result))
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
      component$.switchMap((x: any) => {
        return x.redirect$
      }).map(_ => {
        return {
          type: 'replace',
          action: 'REPLACE',
          pathname: sources.Router.createHref('')
        }
      }),
      muxed_router.no_listing_id$.map(x => {
        return {
          type: 'replace',
          action: 'REPLACE',
          pathname: '/'
        }
      }),
      component$.switchMap((x: any) => {
        return (x.not_authorized$ || O.never())
      }).map(x => {
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
    ).map(x => {
      return x
    })
  }
}