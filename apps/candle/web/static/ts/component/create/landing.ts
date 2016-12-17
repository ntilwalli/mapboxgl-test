import {Observable as O} from 'rxjs'
import {div, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../utils'
import {
  renderMenuButton, renderUserProfileButton, renderLoginButton, 
  renderSearchCalendarButton
} from '../helpers/navigator'

function intent(sources) {
  const {DOM} = sources
  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)
  const show_user_profile$ = DOM.select(`.appShowUserProfileButton`).events(`click`)
  const show_search_calendar$ = DOM.select(`.appShowSearchCalendarButton`).events(`click`)
  const create_new_listing$ = DOM.select(`.appCreateNewListing`).events(`click`)
  
  return {
    show_menu$,
    show_user_profile$,
    show_search_calendar$,
    create_new_listing$
  }
}

function reducers(actions, inputs) {
  return O.never()
}
function model(actions, inputs) {
  const init = {}
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      const {authorization} = info
      const init = {authorization}
      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
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
      renderUserProfileButton()
    ])
  ])
}

function view(state$) {
  return state$.map(state => {
    return div(`.create-landing`, [
      renderNavigator(state),
      div(`.content-section`, [
        div(`.content`, [
          button(`.appCreateNewListing.create-new-listing`, [
            `Create New Listing`
          ])
        ])
      ])
    ])
  })
}

function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model({}, inputs)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    Router: O.merge(
      actions.show_search_calendar$.mapTo({
        pathname: `/`,
        action: `PUSH`
      }),
      actions.show_user_profile$.mapTo({
        pathname: `/home`,
        action: `PUSH`
      }),
      actions.create_new_listing$.map(x => ({
        pathname: `/create/listing`,
        action: `PUSH`,
        state: {
          type: `new`
        }
      }))
    ),
    MessageBus: O.merge(
      actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`})
    )
  }
}

export {
  main
}