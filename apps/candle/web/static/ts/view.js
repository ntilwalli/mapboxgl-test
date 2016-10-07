import {div} from '@cycle/dom'
import {normalizeSink, createProxy, combineObj} from './utils'

export default function view(components) {
  return combineObj(components).map(components => {
    const {child, modal} = components
    return div(`.root-container`, [
      child,
      modal
    ])
  })
}
