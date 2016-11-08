import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../utils'

function intent(sources) { 
  const {DOM} = sources
  const close$ = DOM.select(`.appModalBackdrop`).events(`click`)
    .filter(targetIsOwner)

  return {
    close$
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
                div(`.item`, [auth ? `Logout` : `Login`])
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
    MessageBus: actions.close$.mapTo({to: `main`, message: `hideModal`}),
  }
}
