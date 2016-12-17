import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
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

  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  const show_login$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const show_user_profile$ = DOM.select(`.appShowUserProfileButton`).events(`click`)
    .publishReplay(1).refCount()

  const show_search_calendar$ = DOM.select(`.appShowSearchCalendarButton`).events(`click`)
    .publishReplay(1).refCount()

  return {
    listing$,
    not_found$,
    show_menu$,
    show_login$,
    show_user_profile$,
    show_search_calendar$
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
      //console.log(`Got push state`, pushState)
      return Profile(
        {...sources, Router: Router.path(route.path.substring(1))}, 
        {...inputs, props$: O.of(drillInflate(pushState))}
      )
    } else {
      const listingId = route.path.substring(1)
      //console.log(`No push state, retrieving listing by id ${listingId}`)
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
          actions.not_found$.map(message => ({
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
        //.do(x => console.log(`toHTTP`, x))
        .delay(0)  // ensure sinks are wired up before firing this
      }
    }
  }
}

function model(actions, inputs) {
  return combineObj({
      props$: inputs.props$.take(1), 
      authorization$: inputs.Authorization.status$.take(1)
    })
    .map((info: any) => {
      const {authorization, props} = info
      return Immutable.Map({
        authorization,
        listing: props.listing
      })
    })
    .map(x => x.toJS())
    //.do(x => console.log(`listing/main state`, x))
    .publishReplay(1).refCount()
}


function renderNavigator(state) {
  const {authorization} = state
  //const authClass = authorization ? `Logout` : `Login`
  //console.log(authorization)
  return div(`.navigator-section`, [
    div(`.section`, [
      renderMenuButton()
    ]),
    div(`.section`, [
      renderSearchCalendarButton(),
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
      return div(`.listing-component.application`, [
        renderNavigator(state),
        div(`.content-section`, [
          content
        ])
      ])
    })
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)
  const state$ = model(
    actions, {
      ...inputs, 
      props$: sources.Router.history$.map(x => x.state)
    })
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
      actions.show_search_calendar$.withLatestFrom(state$, (_, state) => {
        return {
          pathname: `/`,
          action: `push`,
          state: {
            searchDateTime: state.listing.cuando.begins.clone().toDate().toISOString()
          }
        }
      }),
      componentified.Router,
      actions.show_user_profile$.mapTo({
        pathname: `/home`,
        action: `PUSH`
      })
    ),
    MessageBus: O.merge(
      componentified.MessageBus,
      actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`}),
      actions.show_login$.mapTo({to: `main`, message: `showLogin`}),
    )
  })
}