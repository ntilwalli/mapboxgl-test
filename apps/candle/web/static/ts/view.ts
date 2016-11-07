import {div} from '@cycle/dom'
import {combineObj} from './utils'

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      const {content, modal} = components
      state.modal ? console.log(modal) : null
      return div(`.root-container`, [
        content,
        state.modal ? modal : null
      ])
    })
}

export default view