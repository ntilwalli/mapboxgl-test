import {Observable as O} from 'rxjs'
import {div, header, span, button, nav, a, ul, li} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../utils'

function intent(sources) { 
  const {DOM} = sources
  const close$ = DOM.select(`.appModalBackdrop`).events(`click`)
    .filter(targetIsOwner)

  const logout$ = DOM.select(`.appShowLogoutButton`).events(`click`)
  const login$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const signup$ = DOM.select(`.appShowSignupButton`).events(`click`)
  const show_settings$ = DOM.select(`.appShowSettingsButton`).events(`click`)
  const show_create_workflow$ = DOM.select(`.appShowCreateWorkflowButton`).events(`click`)
  return {
    close$,
    logout$,
    login$,
    signup$,
    show_settings$,
    show_create_workflow$
  } 
}

function renderNavigator(state) {
  const {authorization} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid', [
    div('.row.no-gutter', [
      div('.col-xs-6', [
        a('.hopscotch-icon.btn.btn-link.nav-brand', {attrs: {href: '#'}}, []),
      ]),
      div('.col-xs-6', [
        button('.appShowMenuButton.fa.fa-bars.btn.btn-link.float-xs-right', [])
      ]),
    ])
  ])
}


function view(auth$) {
  return auth$
    .map(auth => {
      return div(`.modal-component`, [
        div(`.appModalBackdrop.modal-backdrop`, [
          div(`.main-menu-modal`, [
            renderNavigator({authorization: auth}),
            ul('.list-unstyled.menu-items', [
              auth ? li([
                button(`.btn.btn-link`, {class: {appShowCreateWorkflowButton: true}}, [`Add New Listing`]) 
              ]) : null,
              li([
                button(`.btn.btn-link`, {class: {appShowSettingsButton: true}}, [`Settings`])
              ]),
              li([
                button(`.btn.btn-link`, {class: {appShowLogoutButton: !!auth, appShowLoginButton: !auth}}, [auth ? `Log-out` : `Log-in`])
              ]),
              !auth ? li([
                button(`.btn.btn-link`, {class: {appShowSignupButton: true}}, ['Sign-up'])
              ]) : null
            ])
          ])
        ])
      ])
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  
  return {
    DOM: view(inputs.Authorization.status$),
    Router: O.merge(
        actions.show_settings$.mapTo({
          pathname: `/settings`, 
          action: `PUSH`
        }),
        actions.show_create_workflow$.mapTo({
          pathname: `/create`,
          actions: `PUSH`
        })
      ),
    MessageBus: O.merge(
      actions.close$.mapTo({to: `main`, message: `hideModal`}),
      actions.logout$.mapTo({to: `/authorization/logout`}),
      actions.login$.mapTo({to: `main`, message: `showLogin`}),
      actions.signup$.mapTo({to: `main`, message: `showSignup`}),
      //actions.show_settings$.mapTo({to: `main`, message: `showSettings`})
    )
  }
}
