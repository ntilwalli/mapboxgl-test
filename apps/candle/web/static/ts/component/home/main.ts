import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, inflateListing, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderSearchCalendarButton} from '../renderHelpers/controller'

//import {main as Profile} from './profile/main'
import {main as Invalid} from './invalid'

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `getUserHome`)
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
  const showSearchCalendar$ = DOM.select(`.appShowSearchCalendarButton`).events(`click`)
    .publishReplay(1).refCount()

  showSearchCalendar$.subscribe(x => console.log(`user profile clicked...`))

  return {
    listing$,
    notFound$,
    showMenu$,
    showLogin$,
    showSearchCalendar$
  }
}

function model(actions, inputs) {
  return inputs.Authorization.status$
    .map(authorization => {
      return Immutable.Map({
        authorization,
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
      authorization ? renderSearchCalendarButton() : null
    ])
  ])
}

function view(state$, components) {
  return state$.map(state => {
      return div(`.user-component`, [
        renderController(state),
        div(`.profile`, {style: {paddingTop: "2rem"}}, [`My profile`])
      ])
    })
}

export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const components = {}

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
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