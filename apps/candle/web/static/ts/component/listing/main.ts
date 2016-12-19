import {Observable as O} from 'rxjs'
import {div, span, button, nav, a} from '@cycle/dom'
import {combineObj, inflateListing, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderSearchCalendarButton, renderUserProfileButton} from '../helpers/navigator'

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
  // console.log(result)
  result.listing = inflateListing(result.listing)
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `getListingById`)
  const listing$ = good$
    .do(x => console.log(`got listing`, x))
    .filter(onlySuccess)
    .pluck(`data`)
    .map(drillInflate)
    .publish().refCount()
  
  const not_found$ = good$
    .filter(onlyError)
    .pluck(`data`)
    .publish().refCount()

  return {
    listing$,
    not_found$,
  }
}



export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)

  const route$ = Router.define(routes).publishReplay(1).refCount()

  const success$ = route$
    .filter(route => route.value.info.type === 'success')
    .publishReplay(1).refCount()

  const error$ = route$
    .filter(route => route.value.info.type === 'error')
    .map(x => Invalid(sources, inputs))


  const profile$ = success$
    .filter(route => route.location.state)
    .map(route => {
      const {type} = route.value.info
      if (type === "error") {
        return Invalid(sources, inputs)
      } else {
        return Profile(
          {...sources, Router: Router.path(route.path.substring(1))}, 
          {...inputs, props$: O.of(drillInflate(route.location.state))}
        )
      }
    })

  const component$ = O.merge(profile$, error$).publishReplay(1).refCount()

  const component = componentify(component$)

  const to_router$ = O.merge(
    actions.listing$.map(result => { 
      //return //[
        //{action: 'pop'}, 
        return {
          type: 'replace',
          action: 'REPLACE',
          state: result,
          pathname: '/listing/' + result.listing.id
        }
      //]
    }), 
    actions.not_found$.map(message => {
      //return //[
        //{action: 'pop'}, 
        return {
          type: 'replace',
          action: 'REPLACE',
          state: message,
          pathname: '/listing/notFound'
        }
      //]
    })//.switchMap(x => O.from(x))
  )

  const to_http$ = success$
    .filter(route => !route.location.state)
    .map(route => route.path.substring(1))
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


  return {
    ...component,
    HTTP: O.merge(component.HTTP, to_http$),
    Router: O.merge(component.Router, to_router$)
  }
}