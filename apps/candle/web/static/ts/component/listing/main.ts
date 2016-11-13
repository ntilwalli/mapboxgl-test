import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'
import {combineObj, inflateListing, processHTTP, componentify, spread} from '../../utils'

import {main as Profile} from './profile/main'
import {main as Invalid} from './invalid'

const routes = [
  {pattern: /^\/\d*$/, value: {type: "success"}},
  {pattern: /^\/notFound$/, value: {type: "error"}},
  {pattern: /.*/, value: {type: "error"}}
]

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  return result
}

function intent(sources) {
  const {HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `getListingById`)
  const listing$ = good$
    .do(x => console.log(`got listing`, x))
    .filter(onlySuccess)
    .pluck(`data`)
    .map(drillInflate)
    .publish().refCount()
  
  const notFound$ = good$
    .filter(onlyError)
    .pluck(`data`)
    .publish().refCount()

    return {
      listing$,
      notFound$
    }
}

function fromRoute(route: any, sources, inputs, actions): any {
  const {Router} = sources
  const data = route.value
  const info = data.info
  const type = info.type
  const location = route.location
  const pushState = location.state

  if (type === "error") {
    if (route.path === "invalid") {
      console.log(`Invalid`)
      return Invalid(sources, spread(inputs, {props$: O.of(pushState)}))
    } else {
      console.log(`Not found`)
      return Invalid(sources, spread(inputs, {props$: O.of(pushState)}))
    }
  } else {

    if (pushState) {
      console.log(`Got push state`, pushState)
      return Profile(
        spread(sources, {
          Router: Router.path(route.path.substring(1))
        }), 
        spread(inputs, {props$: O.of(drillInflate(pushState))})
      )
    } else {
      const listingId = route.path.substring(1)
      console.log(`No push state, retrieving listing by id ${listingId}`)
      return {
        DOM: O.of(div(`.waiting-screen.flex-center`, [
          span(`.loader`, [])
        ])),
        Router: O.merge(
          actions.listing$.map(result => ({
            action: `push`,
            state: result,
            pathname: `/listing/${result.listing.id}`
          })), 
          actions.notFound$.map(message => ({
            action: `push`,
            state: message,
            pathname: `/listing/notFound`
          }))
        ),
        HTTP: O.of({
          url: `/api/user`,
          method: `post`,
          send: {
            route: "/retrieve_listing",
            data: listingId
          },
          category: `getListingById`
        })
        .do(x => console.log(`toHTTP`, x))
        .delay(0)  // ensure sinks are wired up before firing this
      }
    }
  }
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)
  const routing$ = Router.define(routes)
    .map(r => fromRoute(r, sources, inputs, actions))
    .publishReplay(1).refCount()

  return componentify(routing$)
}