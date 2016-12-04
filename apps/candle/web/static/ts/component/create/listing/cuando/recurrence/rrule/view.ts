import {Observable as O} from 'rxjs'
import {div, input} from '@cycle/dom'
import {combineObj} from '../../../../../../utils'

export default function view(state$, components) {
  return state$.map(state => {
    const {session} = state
    return div(`.formula-input-section`, [
      input(`.appFormulaInput.formula-input`, {attrs: {}})
    ])
  })
}