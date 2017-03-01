import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, nav, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, createProxy, traceStartStop, processHTTP, componentify} from '../../utils'

import ProfileInfo from './profileInfo'
//import MyListings from './myListings'
import Participation from './participation'
import HomeMenu from './navigator'
import UserProfile from './profile/main'
import Listings from './listings/main'
import Notifications from './notifications/main'
import Navigator from '../../library/navigators/user'
import WTF from '../../library/wtf'
import UserNotFound from '../../library/listingNotFound'
import TimeoutLoader from '../../library/timeoutLoader'

import UserProfileQuery from '../../query/userProfileQuery'

import {inflateListing} from '../helpers/listing/utils'

const routes = [
  {pattern: /^\/(home)$/, value: {type: "success"}},
  {pattern: /^\/([a-zA-Z][a-zA-Z0-9]*)/, value: {type: "success"}},
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
        div({class: {"translate-down-listing": active}}, [
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
function muxRouter(sources, inputs) {
  const {Router} = sources
  const route$ = Router.define(routes)
    .publishReplay(1).refCount()
  const success$ = route$.filter(route => route.value.info.type === 'success')
    .do(route => {
      console.log('success route', route)
    })
    .publishReplay(1).refCount()
  const user$ = success$
    .filter(route => !!route.location.state)
    .map(route => route.location.state)
    .do(x => {
      console.log('result from router', x)
    })
    .publishReplay(1).refCount()
  const li_wo_push_state$ = success$
    .filter(route => {
      return !route.location.state
    })

  const page_name$ = li_wo_push_state$
    .map(route => route.value.match[1])
    .publishReplay(1).refCount()

  const pair_with_authorization$ = page_name$
    .withLatestFrom(inputs.Authorization.status$, (page_name, authorization) =>{
      return {page_name, authorization}
    }).publishReplay(1).refCount()


  const retrieve_user$ = pair_with_authorization$
  // .filter(({page_name, authorization}) => {
  //   return !authorization || page_name !== authorization.username
  // })
  // .map(x => {
  //   return x
  // })
  .publishReplay(1).refCount()

  const self$ = pair_with_authorization$.filter(({page_name, authorization}) => {
    return authorization && page_name === authorization.username
  }).map((x: any) => {
    return x.authorization
  }).publishReplay(1).refCount()

  const no_username$ = route$.filter(route => {
      return route.value.info.type === 'error'
    })
    .publishReplay(1).refCount()

  return {
    user_result$: O.merge(user$),
    retrieve_user$,
    no_username$,
    route$
  }
}

function muxHTTP(sources) {
  const {HTTP} = sources
  const {success$, error$, good$, bad$, ugly$} = processHTTP(sources, `getUserByUsername`)

  return {
    user_result_from_http$: success$,
    user_result_error_from_http$: error$
  }
}

//function toComponent(sources, inputs)

export default function main(sources, inputs): any {

  const {Router} = sources
  const muxed_router = muxRouter(sources, inputs)
  const muxed_http = muxHTTP(sources)

  const user_profile_query = UserProfileQuery(sources, {
    ...inputs, 
    props$: muxed_router.retrieve_user$.map((x: any) => x.page_name)
  })

  const component$ = O.merge(
    muxed_router.retrieve_user$.map(_ => TimeoutLoader(sources, inputs)),
    user_profile_query.error$.map(_ => {
      return {
        Router: O.of({
          pathname: '/',
          type: 'replace'
        })
      }
    }).delay(1),
    muxed_router.user_result$.map((user: any) => {
      const router_with_listing_id = sources.Router.path(user.username)
      const navigator = isolate(Navigator)({...sources, Router: router_with_listing_id}, {
        ...inputs, 
        props$: O.of(user)
      })


      const content$ = navigator.output$
        .map(page => {
          if (!page || page === 'profile') {
            const out = UserProfile({...sources, Router: router_with_listing_id.path(page)}, {...inputs, props$: O.of(user)})
            return out
          } else if (!page || page === 'listings') {
            const out = Listings({...sources, Router: router_with_listing_id.path(page)}, {...inputs, props$: O.of(user)})
            return out
          } else if (!page || page === 'notifications') {
            const out = Notifications({...sources, Router: router_with_listing_id.path(page)}, {...inputs, props$: O.of(user)})
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
  const merged = mergeSinks(component, user_profile_query)

  return {
    ...merged,
    DOM: component.DOM,
    Router: O.merge(
      merged.Router.map(x => {
        return x
      }),
      combineObj({
        route: muxed_router.route$, 
        result: user_profile_query.success$
      }).map((info: any) => {
        const {route, result} = info
        return {
          type: 'replace',
          action: 'REPLACE',
          pathname: route.location.pathname,
          state: result
        }
      }),
      muxed_router.no_username$.map(x => {
        return {
          type: 'replace',
          action: 'REPLACE',
          pathname: '/'
        }
      })
    ).map(x => {
      return x
    })
  }
}