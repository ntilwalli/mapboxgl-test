import {div} from '@cycle/dom'
import {normalizeSink, createProxy, combineObj} from './utils'

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)}).map(inputs => {
    const {state, components} = inputs
    const {child, modal} = components
    return div(`.root-container`, [
      child,
      modal
    ])
  })
}
