import {Observable as O} from 'rxjs'
import {div, h6, h5, h4} from '@cycle/dom'

export default function main(sources, {component, title, id}) {
  return {
    ...component,
    DOM: component.DOM.map(c => {
      return div('.appClickSection', [
        title && title.length ? h4([title]) : null,
        c
      ])
    }),
    focus$: sources.DOM.select('.appClickSection').events('click').mapTo(id)
  }
}