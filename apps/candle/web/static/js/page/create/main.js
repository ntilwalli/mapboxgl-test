import {Observable as O} from 'rxjs'
import view from './view'
import intent from './intent'
import model from './model'
import {RETRIEVE_LISTING_URL} from './constant'

import {div} from '@cycle/DOM'

import {normalizeSink, mergeSinks, combineObj, spread} from '../../utils'

import Heading from '../../library/heading/standard/main'
import Landing from './landing/main'
import Meta from './meta/main'
import Description from './description/main'

import RedirectRestricted from '../../redirectRestricted'
import RedirectCreate from '../../redirectCreate'

import Workflow from './workflow/main'

// const Workflow = () => ({
//   DOM: O.of(div([`Workflow`]))
// })

const InconsistentListingIds = () => ({
  DOM: O.of(div([`Inconsistent listing ids`]))
})

const routes = [
  {pattern: /^\/meta$/, value: {type: "component", data: Meta}},
  {pattern: /^\/description$/, value: {type: "component", data: Description}},
  {pattern: /^\/([0-9]+)/, value: {type: "listingId", data: Workflow}},
  {pattern: /^\/?$/, value: {type: "component", data: Landing}},
  {pattern: /\/?.*/, value: {type: `error`, data: RedirectCreate}},
]

// const routes = [
//   '/': {type: `component`, data: Landing},
//   '/meta': {type: "component", data: Meta},
//   '/description': {type: "component", data: Description},
//   '/:id': (listingId) => {
//     const converted = parseInt(listingId)
//     if(isNaN(converted)) {
//       return {
//         type: `listingId`,
//         data: undefined
//       }
//     } else {
//       return {
//         type: `listingId`,
//         data: converted
//       }
//     }
//   }
// }

function isForHTTP (route) {
  return route.value.info.type === `listingId` && route.value.info.data && !route.location.state
}

export default function main(sources, inputs) {
  const {Router} = sources
  const {authorization$} = inputs
  const isAuthorized$ = inputs.authorization$
    .filter(x => !!x)
  const notAuthorized$ = inputs.authorization$
    .filter(x => !x)
    .map(() => RedirectRestricted(sources, inputs))

  const definedRoutes$ = Router.define(routes).publishReplay(1).refCount()

  const route$ = isAuthorized$.switchMap(() => definedRoutes$)
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  // const route$ = isAuthorized$.switchMap(() => Router.history$.map(toRoutes))
  //   .publishReplay(1).refCount()

  const toHTTP$ = route$
    .filter(route => isForHTTP(route))
    .map(route => ({
        url: RETRIEVE_LISTING_URL,
        action: `GET`,
        send: {id: route.value.data},
        category: `retrieveListing`
    }))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const toComponent$ = route$
    .filter(route => !isForHTTP(route))

  const component$ = O.merge(
    notAuthorized$,
    toComponent$.map(route => {
      const {value, path} = route
      const match = value.match
      const {type, data} = value.info
      if (type === `component`) {
        //return data(spread(sources, {Router: Router.path(path.substring(1))}), inputs)
        return data(sources, spread(inputs, {ParentRouter: Router}))
      } else if (type === `listingId`){
        const routeId = parseInt(match[1])
        const pushState = route.location.state
        const listingId = pushState.id
        if (routeId === listingId) {
          return Workflow(spread(sources, {Router: Router.path("" + listingId)}), inputs)
        } else {
          return InconsistentListingIds(sources, inputs)
        }
      }
    })
  ).publishReplay(1).refCount()

  const actions = intent(sources)

  const state$ = model(actions, spread(inputs, {startWaiting$: toHTTP$}))


  return {
    DOM: normalizeSink(component$, `DOM`),
    HTTP: O.merge(
      toHTTP$,
      normalizeSink(component$, `HTTP`)
    ),
    Router: O.merge(
      actions.fromHTTP$
        .switchMap(listing => Router.history$.take(1).map(route => {
          return {
            pathname: route.pathname + route.search,
            action: `REPLACE`,
            state: listing
          }
        })),
      normalizeSink(component$, `Router`)
    ),
    Global: normalizeSink(component$, `Global`).map(x => {
      return x
    }),
    Storage: normalizeSink(component$, `Storage`),
    MapJSON: normalizeSink(component$, `MapJSON`),
    MapDOM: normalizeSink(component$, `MapDOM`),
    message$: normalizeSink(component$, `message$`),
  }
}
