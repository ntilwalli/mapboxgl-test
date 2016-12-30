import {Observable as O} from 'rxjs'
import {div, nav, span, button} from '@cycle/dom'
import {combineObj, mergeSinks, createProxy, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderSearchCalendarButton} from '../helpers/navigator'

//import {main as Profile} from './profile/main'
import {main as Invalid} from './invalid'

import ProfileInfo from './profileInfo'
//import MyListings from './myListings'
import Participation from './participation'
import HomeMenu from './navigator'
import UserProfile from '../userProfile/main'
import Listings from './listings/main'

function NotImplemented(sources, inputs) {
  return {
    DOM: O.of(div('.not-implemented.container.nav-fixed-offset', ['Not implemented']))
  }
}

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function drillInflate(result) {
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `getHomeProfile`)
  const profile$ = good$
    //.do(x => console.log(`got home/profile response`, x))
    .filter(onlySuccess)
    .pluck(`data`)
    .map(drillInflate)
    .publish().refCount()
  
  const error$ = good$
    .filter(onlyError)
    .pluck(`data`)
    .publish().refCount()

  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  return {
    profile$,
    error$,
    show_menu$
  }
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.Authorization.status$
    .map(authorization => {
      return {
        authorization
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}


function renderNavigator(info: any) {
  const {state, components} = info
  const {home_menu} = components
  const {authorization} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid.pos-f-t', [
    home_menu
  ])
}


function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      //const {authorization, profile, selected_check_in} = state
      const {profile_info, my_listings, participation, content} = components
      const show_waiting = !(profile_info && my_listings && participation)
      return div(`.screen.user-profile`, [
        renderNavigator(info),
        content
        // show_waiting ? div('.loader', []) : div('.container-fluid.nav-fixed-offset.mt-1', [
        //   profile_info,
        //   div('.row.mt-1', [
        //     div('.col-xs-12', [
        //       my_listings 
        //     ])
        //   ]),
        //   div('.row.mt-1', [
        //     div('.col-xs-12', [
        //       participation 
        //     ])
        //   ])
        // ])
      ])
    })
}

export default function main(sources, inputs): any {
  const actions = intent(sources)
  
  const participation = Participation(sources, inputs)
  const profile_info = ProfileInfo(sources, inputs)
  const home_menu = HomeMenu(sources, inputs)

  const content$ = home_menu.output$
    .map(page => {
      if (page === 'profile') {
        return UserProfile(sources, inputs)
      } else if (page === 'listings') {
        return Listings(sources, inputs)
      } else {
        return NotImplemented(sources, inputs)
      }
    }).publishReplay(1).refCount()

  const content = componentify(content$)



  const state$ = model(actions, inputs)

  const components = {
    participation$: participation.DOM,
    //my_listings$: my_listings.DOM,
    profile_info$: profile_info.DOM,
    home_menu$: home_menu.DOM,
    content$: content.DOM
  }

  const vtree$ = view(state$, components)
  const toHTTP$ = O.merge(
    O.of({
      url: `/api/user`,
      method: `post`,
      category: `getHomeProfile`,
      send: {
        route: `/home/profile`
      }
    }).delay(0),
  )

  const merged = mergeSinks(participation, profile_info, content)

  return {
    ...merged,
    DOM: vtree$,
    HTTP: O.merge(merged.HTTP, toHTTP$),
    Router: O.merge(
      merged.Router
    ),
    MessageBus: O.merge(
      merged.MessageBus,
      actions.show_menu$.mapTo({to: `main`, message: {type: `showLeftMenu`, data: {redirect_url: '/'}}}), 
    )
  }
}