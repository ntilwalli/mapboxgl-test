import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, createProxy, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderSearchCalendarButton} from '../helpers/navigator'

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

  const showLogin$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const showSearchCalendar$ = DOM.select(`.appShowSearchCalendarButton`).events(`click`)
    .publishReplay(1).refCount()

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

  const selected_check_in_r = inputs.selected_check_in$.map(x => state => {
    return state.set(`selected_check_in`, x)
  })

  return O.merge(profile_r, error_r, selected_check_in_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.Authorization.status$
    .map(authorization => {
      return {
        authorization, 
        selected_check_in: undefined,
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
    //.do(x => console.log(`home/profile state`, x))
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
      renderSearchCalendarButton()
    ])
  ])
}

function render_check_in(info) {
  return div(`.check-in`, [
    span([info.listing_name]),
    ', ',
    span([info.check_in_datetime.format('LT')])
  ])
}

function renderBreakdown(info) {
  let out

  if (info.length) {
    out = info.map(render_check_in)
  } else {
    out = [`No check-ins on this day`]
  }

  return div(`.check-ins-breakdown`, out)
}

function render_selected_check_in_date(info) {
  const date = info.date
  return div(`.selected-date-section`, [
    div(`.heading`, [date.format('LL')]),
    renderBreakdown(info.check_ins)
  ])
}

function render_profile_info(authorization, profile) {
  return div(`.info`, [
    div([authorization.name]),
    div([`(@${authorization.username})`])
  ])
}

function render_participation(info) {
  const {state, components} = info
  const {authorization, profile, selected_check_in} = state
  const {check_in_grid} = components

  return div(`.participation`, [
    span(`.heading`, [
      `Participation (Last 28 days)`
    ]),
    check_in_grid,
    selected_check_in ? render_selected_check_in_date(selected_check_in) : null
  ])
}

function renderContent(info) {
  const {state, components} = info
  const {authorization, profile} = state
  const {check_in_grid} = components

  return div(`.content-section`, [
    div(`.content`, [
      render_profile_info(authorization, profile),
      render_participation(info)
    ])
  ])
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      const {authorization, profile, selected_check_in} = state
      const {check_in_grid} = components
      return div(`.user-component.application`, [
        renderNavigator(state),
        renderContent(info)
      ])
    })
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)
  
  const check_in_grid = CheckInGrid(sources, inputs)

  const state$ = model(actions, {...inputs, selected_check_in$: check_in_grid.output$})

  const components = {
    check_in_grid$: check_in_grid.DOM
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
    check_in_grid.HTTP
  )

  return {
    DOM: vtree$,
    HTTP: toHTTP$,
    Router: O.merge(
      actions.showSearchCalendar$.mapTo({
        pathname: `/`,
        type: 'push',
        action: 'PUSH'
      })
    ),
    MessageBus: O.merge(
      actions.showMenu$.mapTo({to: `main`, message: `showLeftMenu`}),
      actions.showLogin$.mapTo({to: `main`, message: `showLogin`}),
    )
  }
}