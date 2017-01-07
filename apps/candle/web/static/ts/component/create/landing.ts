import {Observable as O} from 'rxjs'
import {div, button, nav} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../utils'
import {
  renderMenuButton, renderUserProfileButton, renderLoginButton, 
  renderSearchCalendarButton
} from '../helpers/navigator'

function intent(sources) {
  const {DOM} = sources
  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)
  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)
  const create_new_listing$ = DOM.select(`.appCreateNewListing`).events(`click`)
  
  return {
    show_menu$,
    create_new_listing$,
    brand_button$
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
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid', [
    div('.row.no-gutter', [
      div('.col-6', [
        button('.appBrandButton.hopscotch-icon.btn.btn-link.nav-brand', []),
      ]),
      div('.col-6.d-flex.justify-content-end', [
        button('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link', [])
      ]),
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
      actions.create_new_listing$.map(x => ({
        pathname: `/create/listing`,
        type: `push`,
        state: {
          type: `new`
        }
      })),
      actions.brand_button$.map(x => '/')
    ),
    MessageBus: O.merge(
      actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`})
    )
  }
}

export {
  main
}