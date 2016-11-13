import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../utils'

function intent(sources) { 
  const {DOM} = sources
  const close$ = DOM.select(`.appModalBackdrop`).events(`click`)
    .filter(targetIsOwner)

  const logout$ = DOM.select(`.appMenuLogoutButton`).events(`click`)
  const login$ = DOM.select(`.appMenuLoginButton`).events(`click`)
  return {
    close$,
    logout$,
    login$
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
                button(`.item`, {class: {appMenuLogoutButton: !!auth, appMenuLoginButton: !auth}}, [auth ? `Logout` : `Login`])
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
    MessageBus: O.merge(
      actions.close$.mapTo({to: `main`, message: `hideModal`}),
      actions.logout$.mapTo({to: `/authorization/logout`}),
      actions.login$.mapTo({to: `main`, message: `showLogin`})
    )
  }
}
