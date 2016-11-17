import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../utils'

function intent(sources) { 
  const {DOM} = sources
  const close$ = DOM.select(`.appModalBackdrop`).events(`click`)
    .filter(targetIsOwner)

  const logout$ = DOM.select(`.appShowLogoutButton`).events(`click`)
  const login$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const show_settings$ = DOM.select(`.appShowSettingsButton`).events(`click`)
  return {
    close$,
    logout$,
    login$,
    show_settings$
  } 
}

function view(auth$) {
  return auth$
    .map(auth => {
      return div(`.modal-component`, [
        div(`.appModalBackdrop.modal-backdrop`, [
          div(`.left-menu-modal`, [
            div(`.left-menu-content`, [
              div(`.left-menu-header`, [
                `Hopscotch!`
              ]),
              div(`.left-menu-body`, [
                button(`.item`, {class: {appShowSettingsButton: true}}, [`Settings`]),
                button(`.item`, {class: {appShowLogoutButton: !!auth, appShowLoginButton: !auth}}, [auth ? `Logout` : `Login`])
              ]),
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
    Router: actions.show_settings$.mapTo({
      pathname: `/settings`, 
      action: `PUSH`
    }),
    MessageBus: O.merge(
      actions.close$.mapTo({to: `main`, message: `hideModal`}),
      actions.logout$.mapTo({to: `/authorization/logout`}),
      actions.login$.mapTo({to: `main`, message: `showLogin`}),
      //actions.show_settings$.mapTo({to: `main`, message: `showSettings`})
    )
  }
}
