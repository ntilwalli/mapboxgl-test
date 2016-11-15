import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, inflateListing, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderSearchCalendarButton} from '../renderHelpers/controller'

//import {main as Profile} from './profile/main'
import {main as Invalid} from './invalid'
import {main as CheckInGrid} from '../../library/checkInGrid'

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function drillInflate(result) {
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `getHomeProfile`)
  const profile$ = good$
    .do(x => console.log(`got home/profile response`, x))
    .filter(onlySuccess)
    .pluck(`data`)
    .map(drillInflate)
    .publish().refCount()
  
  const error$ = good$
    .filter(onlyError)
    .pluck(`data`)
    .publish().refCount()

  const showMenu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  const showLogin$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const showSearchCalendar$ = DOM.select(`.appShowSearchCalendarButton`).events(`click`)
    .publishReplay(1).refCount()

  showSearchCalendar$.subscribe(x => console.log(`user profile clicked...`))

  return {
    profile$,
    error$,
    showMenu$,
    showLogin$,
    showSearchCalendar$
  }
}

function reducers(actions, inputs) {
  const profile_r = actions.profile$.map(x => state => {
    return state.set(`profile`, x).set(`in_flight`, false)
  })

  const error_r = actions.error$.map(x => state => {
    return state.set(`in_flight`, false)
  })

  return O.merge(profile_r, error_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.Authorization.status$
    .map(authorization => {
      return {
        authorization, 
        profile: undefined,
        in_flight: true
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`home/profile state`, x))
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
      authorization ? renderSearchCalendarButton() : null
    ])
  ])
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map((info: any) => {
      const {state, components} = info
      const {authorization} = state
      const {checkInGrid} = components
      return div(`.user-component`, [
        renderController(state),
        div(`.profile`, {style: {paddingTop: "2rem"}}, [authorization.name]),
        checkInGrid
      ])
    })
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const checkInGrid = CheckInGrid(sources, inputs)
  const components = {
    checkInGrid: checkInGrid.DOM
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
    checkInGrid.HTTP
  )

  return {
    DOM: vtree$,
    HTTP: toHTTP$,
    Router: O.merge(
      actions.showSearchCalendar$.mapTo({
        pathname: `/`,
        action: `PUSH`
      })
    ),
    MessageBus: O.merge(
      actions.showMenu$.mapTo({to: `main`, message: `showLeftMenu`}),
      actions.showLogin$.mapTo({to: `main`, message: `showLogin`}),
    )
  }
}