import {Observable as O} from 'rxjs'
import {div, nav, span, button} from '@cycle/dom'
import {combineObj, mergeSinks, createProxy, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderSearchCalendarButton} from '../helpers/navigator'

//import {main as Profile} from './profile/main'
import {main as Invalid} from './invalid'

import ProfileInfo from './profileInfo'
import MyListings from './myListings'
import Participation from './participation'

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

  const showMenu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  // const showLogin$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const showSearchCalendar$ = DOM.select(`.appBrandButton`).events(`click`)
    .publishReplay(1).refCount()


  return {
    profile$,
    error$,
    showMenu$,
    showSearchCalendar$
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


function renderNavigator(state) {
  const {authorization} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid', [
    div('.row.no-gutter', [
      div('.col-xs-6', [
        button('.appBrandButton.hopscotch-icon.btn.btn-link.nav-brand', []),
      ]),
      div('.col-xs-6', [
        button('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.float-xs-right', [])
      ]),
    ])
  ])
}


function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      //const {authorization, profile, selected_check_in} = state
      const {profile_info, my_listings, participation} = components
      const show_waiting = !(profile_info && my_listings && participation)
      return div(`.screen.user-profile`, [
        renderNavigator(state),
        show_waiting ? div('.loader', []) : div('.container-fluid.mt-1', [
          profile_info,
          div('.row.mt-1', [
            div('.col-xs-12', [
              my_listings 
            ])
          ]),
          div('.row.mt-1', [
            div('.col-xs-12', [
              participation 
            ])
          ])
        ])
      ])
    })
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)
  
  const participation = Participation(sources, inputs)
  const my_listings = MyListings(sources, inputs)
  const profile_info = ProfileInfo(sources, inputs)


  const state$ = model(actions, inputs)

  const components = {
    participation$: participation.DOM,
    my_listings$: my_listings.DOM,
    profile_info$: profile_info.DOM
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

  const merged = mergeSinks(participation, my_listings, profile_info)

  return {
    ...merged,
    DOM: vtree$,
    HTTP: O.merge(merged.HTTP, toHTTP$),
    Router: O.merge(
      merged.Router, 
      actions.showSearchCalendar$.mapTo({
        pathname: `/`,
        type: 'push',
        action: 'PUSH'
      })
    ),
    MessageBus: O.merge(
      merged.MessageBus,
      actions.showMenu$.mapTo({to: `main`, message: `showLeftMenu`}),
    )
  }
}