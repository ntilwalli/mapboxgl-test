import {Observable as O} from 'rxjs'
import {div, h6} from '@cycle/dom'

export default function main(sources, {component, title, id}) {
  return {
    ...component,
    DOM: component.DOM.map(c => {
      return div('.appClickSection.card.card-block', [
        div('.card-title', [
          h6([title])
        ]),
        c
      ])
    }),
    focus$: sources.DOM.select('.appClickSection').events('click').mapTo(id)
  }
}