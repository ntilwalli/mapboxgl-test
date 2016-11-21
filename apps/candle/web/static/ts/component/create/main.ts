import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, mergeSinks} from '../../utils'
import {renderMenuButton, renderCircleSpinner, renderLoginButton, renderSearchCalendarButton} from '../renderHelpers/navigator'

import {main as routing} from './routing'

// function intent(sources) {
//   return {}
// }

// function reducers(actions, inputs) {
//   return O.merge(O.never())
// }

// function model(actions, inputs) {
//   const init = {}
//   const reducer$ = reducers(actions, inputs)
//   return combineObj({
//       authorization$: inputs.Authorization.status$
//     })
//     .switchMap((info: any) => {
//       const {authorization} = info
//       const init = {authorization}
//       return reducer$
//         .startWith(Immutable.Map(init))
//         .scan((acc, f: Function) => f(acc))
//     })
//     .map((x: any) => x.toJS())
//     .publishReplay(1).refCount()
// }

// function renderCancelButton() {
//   return button(`.appCancelButton.text-button.cancel-button`, [`Cancel`])
// }

// function renderSaveExitButton() {
//   return button(`.appSaveExitButton.text-button.save-exit-button`, [`Save/Exit`])
// }

// function renderNavigator(state: any) {
//   //const {authorization} = state
//   return div(`.navigator`, [
//     div(`.section`, [
//       renderMenuButton()
//     ]),
//     div(`.section`, [
//       span([`Create workflow`])
//     ]),
//     div(`.section`, [
//       div(`.buttons`, [
//         state.waiting ? renderCircleSpinner() : null,
//         renderCancelButton(),
//         renderSaveExitButton()
//       ])
//     ])
//   ])
// }


// function view(state$, components) {
//   return state$.map(state => {
//     return div(`.create-component`, [
//       renderNavigator(state),
//       `create component`
//     ])
//   })
// }

// This component manages auto-saving
function main(sources, inputs) {
  // const actions = intent(sources)
  // const state$ = model(actions, inputs)
  // const components = {}
  // const vtree$ = view(state$, components)

  const component = routing(sources, inputs)

  return component
}

export {
  main
}