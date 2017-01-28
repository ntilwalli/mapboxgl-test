import {Observable as O} from 'rxjs'
import {div, header, span, button, nav, a, ul, li} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../utils'
import Navigator from './navigators/leftMenuModal'
function intent(sources) { 
  const {DOM} = sources
  const close$ = DOM.select('.appModalBackdrop').events('click')
    .filter(targetIsOwner)

  const logout$ = DOM.select(`.appShowLogoutButton`).events(`click`)
  const login$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const signup$ = DOM.select(`.appShowSignupButton`).events(`click`)
  const show_settings$ = DOM.select(`.appShowSettingsButton`).events(`click`)
  const show_privacy$ = DOM.select(`.appShowPrivacyButton`).events(`click`)
  const show_create_workflow$ = DOM.select(`.appShowCreateWorkflowButton`).events(`click`)
  const show_profile$ = DOM.select(`.appShowProfileButton`).events(`click`)
  const brand_button$ = DOM.select('.appBrandButton').events('click')
  return {
    close$,
    logout$,
    login$,
    signup$,
    show_settings$,
    show_create_workflow$,
    show_profile$,
    show_privacy$
  } 
}

function model(actions, inputs) {
  return (inputs.props$ || O.of({}))
    .publishReplay(1).refCount()
}

function renderNavigator(state) {
  const {authorization} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid', [
    div('.row.no-gutter', [
      div('.col-6.d-flex', [
        button('.appBrandButton.hopscotch-icon.btn.btn-link.nav-brand', []),
      ]),
      div('.col-6.d-flex.justify-content-end', [
        button('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.d-flex.justify-content-end', [])
      ]),
    ])
  ])
}


function view(auth$, navigator$) {
  return combineObj({auth$, navigator$})
    .map((info: any) => {
      const {auth, navigator} = info
      return div(`.modal-component`, [
        div(`.appModalBackdrop.modal-backdrop`, [
          div(`.main-menu-modal`, [
            navigator,
            //renderNavigator({authorization: auth}),
            ul('.list-unstyled.menu-items', [
              auth ? li([
                button(`.btn.btn-link`, {class: {appShowProfileButton: true}}, [`Profile`]) 
              ]) : null,
              //auth ? 
              li([
                button(`.btn.btn-link`, {class: {appShowCreateWorkflowButton: true}}, [`Add New Listing`]) 
              ]),// : null,
              li([
                button(`.btn.btn-link`, {class: {appShowSettingsButton: true}}, [`Settings`])
              ]),
              li([
                button(`.btn.btn-link`, {class: {appShowLogoutButton: !!auth, appShowLoginButton: !auth}}, [auth ? `Log-out` : `Log-in`])
              ]),
              !auth ? li([
                button(`.btn.btn-link`, {class: {appShowSignupButton: true}}, ['Sign-up'])
              ]) : null,
              li([
                button(`.btn.btn-link`, {class: {appShowPrivacyButton: true}}, [`Privacy`])
              ]),
            ])
          ])
        ])
      ])
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const navigator = Navigator(sources, inputs)
  return {
    DOM: view(inputs.Authorization.status$, navigator.DOM),
    Router: O.merge(
        navigator.Router,
        actions.show_settings$.mapTo({
          pathname: '/settings', 
          type: 'push',
          action: 'PUSH'
        }),
        actions.show_privacy$.mapTo({
          pathname: '/privacy', 
          type: 'push',
          action: 'PUSH'
        }),
        actions.show_create_workflow$.mapTo({
          pathname: `/create/listing`,
          type: 'push',
          actions: 'PUSH'
        }),
        actions.show_profile$.withLatestFrom(inputs.Authorization.status$, (_, authorization) => {
          return {
            pathname: '/' + authorization.username,
            type: 'push',
            actions: 'PUSH'
          }
        })
      ),
    MessageBus: O.merge(
      actions.close$.mapTo({to: 'main', message: 'hideModal'}),
      navigator.MessageBus,
      actions.logout$.mapTo({to: `/authorization/logout`}),
      actions.login$.withLatestFrom(state$, (_, state) => {
        return ({to: `main`, message: {type: 'showLogin', data: state}})
      }),
      actions.signup$.withLatestFrom(state$, (_, state) => {
        return ({to: `main`, message: {type: 'showSignup', data: state}})
      })
    )
  }
}
