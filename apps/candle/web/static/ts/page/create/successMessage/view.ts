import {Observable as O} from 'rxjs'
import {a, h1, h2, h3, h4, h5, h6, nav, ul, li, div, i, span, button, input, img} from '@cycle/dom'
import {attrs, combineObj} from '../../../utils'

export default function view(props$, components) {
  return combineObj({props$, components$: combineObj(components)}).map(({props, components}: any) => {
    const {heading} = components

      return div(`.create-panel.create-landing`, [
        heading,
        div([`Successfully ${props}`]),
        a({attrs: {href: `/`}}, [`Go home`])
      ])
  })
}
