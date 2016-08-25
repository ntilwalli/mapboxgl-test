import {nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {attrs} from '../../../../utils'

function renderInstruction(state) {
  const inst = state.instruction ? state.instruction : ``
  return div([inst])
}

function renderNavLarge(state) {
  return [
    div(`.comp.pull-xs-left.instruction-area`, [
      renderInstruction(state)
    ]),
    state.isSaving ? div(`.comp.nav-item-right`, [
      div(`.uil-reload-css`, [div()]),
      div(`.save-status`, [`Saving...`])
    ]) : div(`.comp.nav-item-right.save-status`, [`Saved recently`]),
    div(`.appSaveExit.comp.nav-item-right-small`, [`Save and Exit`])
  ]

}

function renderNavSmall(state) {
  return [
    div(`.appSaveExit.comp.nav-item-right`, [`Exit`])
  ]
}

export default function view(state$) {
  return state$.map(state => {
    return {
      large: div(`.nav-menu-items-right`, renderNavLarge(state)),
      small: div(`.nav-menu-items-right`, renderNavSmall(state))
    }
  })
}
