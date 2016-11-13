import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, inflateListing, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderUserProfileButton} from '../renderHelpers/controller'

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
  const {DOM, HTTP} = sources
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

  const showMenu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  const showLogin$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const showUserProfile$ = DOM.select(`.appShowUserProfileButton`).events(`click`)
    .publishReplay(1).refCount()

  showUserProfile$.subscribe(x => console.log(`user profile clicked...`))

  return {
    listing$,
    notFound$,
    showMenu$,
    showLogin$,
    showUserProfile$
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
      //console.log(`Invalid`)
      return Invalid(sources, spread(inputs, {props$: O.of(pushState)}))
    } else {
      //console.log(`Not found`)
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

function model(actions, inputs) {
  return inputs.Authorization.status$
    .map(authorization => {
      return Immutable.Map({
        authorization
      })
    })
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}


function renderController(state) {
  const {authorization} = state
  //const authClass = authorization ? `Logout` : `Login`
  //console.log(authorization)
  return div(`.controller`, [
    div(`.section`, [
      renderMenuButton()
    ]),
    div(`.section`, [
      !authorization ? renderLoginButton() : null,
      authorization ? renderUserProfileButton() : null
    ])
  ])
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      const {content} = components
      return div(`.listing-component`, [
        renderController(state),
        content
      ])
    })
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const content$ = Router.define(routes)
    .map(r => fromRoute(r, sources, inputs, actions))
    .publishReplay(1).refCount()

  const components = {
    content$: content$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, components)

  const componentified = componentify(content$)
  return spread(componentify(content$), {
    DOM: vtree$,
    Router: O.merge(
      componentified.Router,
      actions.showUserProfile$.withLatestFrom(state$, (_, state) => {
        const {authorization} = state
        const {id} = authorization
        return {
          pathname: `/user/${id}`,
          action: `PUSH`
        }
      })
    ),
    MessageBus: O.merge(
      componentified.MessageBus,
      actions.showMenu$.mapTo({to: `main`, message: `showLeftMenu`}),
      actions.showLogin$.mapTo({to: `main`, message: `showLogin`}),
    )
  })
}