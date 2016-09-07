import xs from 'xstream'
import {div, span, input, i, ul, li, a} from '@cycle/dom'
import {noopListener, attrs, renderExternalLink, targetIsOwner} from '../../../../../utils'

function intent(sources) {
  const logout$ = sources.DOM.select(`.appLogOut`).events(`click`).mapTo({type: `logout`})
  const closeMenu$ = sources.DOM
    .select(`.appModal`)
    .events(`click`)
    .filter(targetIsOwner)
    .mapTo({type: `closeMenu`})

  return {
    logout$,
    closeMenu$
  }
}

function renderMenuItemsLarge(state) {
  return [
    renderExternalLink(`Log out`, `.appLogOut.comp.nav-item-right-small`)
  ]
}


function renderMenuItemsSmall(state) {
  return [
    li([`Log out`])
  ]
}

function renderModalBackdrop(state) {
  const show = state.showMenu? `.show`: ``
  return div(`.appModalBackdrop.modal-backdrop.fade.in${show}`)
}

function renderMenuModal(state) {
  const show = state.showMenu ? `.show` : ``
  return [
    div(`.appModal.modal.fade.in${show}`, [
      div(`.slideout-menu`, attrs({role: `document`}), [
        div(`.slideout-menu-header`, [
          div(`.logo.logo-large`)
        ]),
        div(`.slideout-menu-body`, [
          ul(`.list-unstyled`, [
            ...renderMenuItemsSmall(state)
          ])
        ])
      ])
    ]),
    renderModalBackdrop(state)
  ]
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  //console.log(inputs.props$)
  return {
    DOM: inputs.parentState$.map(state => {
      return {
        large: div(`.nav-menu-items-right`, renderMenuItemsLarge(state)),
        small: div(`.nav-menu-items-right`, renderMenuModal(state))
      }
    }),
    message$: xs.merge(...Object.keys(actions).map(k => actions[k])).debug(`messages from menuModal plugin...`)//.addListener(noopListener)
  }
}
