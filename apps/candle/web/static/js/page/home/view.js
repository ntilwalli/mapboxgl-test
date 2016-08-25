import {Observable as O} from 'rxjs'
import {nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {attrs, combineObj} from '../../utils'

export default function view(state$, components) {

  return combineObj({state$, components$: combineObj(components)})
    .map(inputs => {
      const {state, components} = inputs
      const {heading, content} = components
      const {authorization, geolocation} = state
      const val = div(`.page-home`, [
        heading,
        content
      ])

      return val
    })
}
