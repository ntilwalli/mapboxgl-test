// import xs from 'xstream'
// import {div, span, input, i, ul, li, a} from '@cycle/dom'
// import {noopListener, attrs, renderExternalLink} from '../../../../utils'
//

import xs from 'xstream'
import {div, span, input, i, ul, li, a} from '@cycle/dom'
import {noopListener, attrs, renderExternalLink, targetIsOwner} from '../../../../utils'

function intent(sources) {
  const saveExit$ = sources.DOM.select(`.appSaveExit`).events(`click`)

  return {
    saveExit$
  }
}



// function renderNavLarge(state) {
//   return [
//     div(`.comp.pull-xs-left.instruction-area`, [
//       renderInstruction(state)
//     ]),
//     state.isSaving ? div(`.comp.nav-item-right`, [
//       div(`.uil-reload-css`, [div()]),
//       div(`.save-status`, [`Saving...`])
//     ]) : div(`.comp.nav-item-right.save-status`, [`Saved recently`]),
//     div(`.appSaveExit.comp.nav-item-right-small`, [`Save and Exit`])
//   ]
//
// }

function renderInstruction(state) {
  const inst = state.instruction ? state.instruction : ``
  return div([inst])
}

function renderMenuItemsLarge(state) {
  return [
    div(`.comp.pull-xs-left.instruction-area`, [
      renderInstruction(state)
    ]),
    state.isSaving ? div(`.comp.nav-item-right`, [
      div(`.uil-reload-css`, [div()]),
      div(`.save-status`, [`Saving...`])
    ]) : div(`.comp.nav-item-right.save-status`, [`Saved blah recently`]),
    div(`.appSaveExit.comp.nav-item-right-small`, [`Save and Exit`])
  ]
}


function renderMenuItemsSmall(state) {
  return [
    li(`.appSaveExit.nav-item-right-small`, [`Exit`])
  ]
}

function renderModalBackdrop(state) {
  const show = state.showMenu? `.show`: ``
  return div(`.appModalBackdrop.modal-backdrop.fade.in${show}`)
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  //console.log(inputs.props$)
  return {
    DOM: inputs.parentState$.map(state => {
      return {
        large: div(`.nav-menu-items-right`, renderMenuItemsLarge(state)),
        small: div(`.nav-menu-items-right`, renderMenuItemsSmall(state))
      }
    }),
    message$: xs.merge(...Object.keys(actions).map(k => actions[k])).debug(`messages from saveExit plugin...`)//.addListener(noopListener)
  }
}


// function renderInstruction(state) {
//   const inst = state.instruction ? state.instruction : ``
//   return div([inst])
// }
//
// function renderNavLarge(state) {
//   return [
//     div(`.comp.pull-xs-left.instruction-area`, [
//       renderInstruction(state)
//     ]),
//     state.isSaving ? div(`.comp.nav-item-right`, [
//       div(`.uil-reload-css`, [div()]),
//       div(`.save-status`, [`Saving...`])
//     ]) : div(`.comp.nav-item-right.save-status`, [`Saved recently`]),
//     div(`.appSaveExit.comp.nav-item-right-small`, [`Save and Exit`])
//   ]
//
// }
//
// function renderNavSmall(state) {
//   return [
//     div(`.appSaveExit.comp.nav-item-right`, [`Exit`])
//   ]
// }


// import intent from './intent'
// import model from './model'
// import view from './view'
//
// export default function main(sources, inputs) {
//   const actions = intent(sources)
//   const state$ = model(actions, inputs)
//   //console.log(`Hello blah...`)
//   //console.log(state$)
//   return {
//     DOM: view(state$),
//     message$: xs.merge(...Object.keys(actions).map(k => actions[k]))
//   }
// }
