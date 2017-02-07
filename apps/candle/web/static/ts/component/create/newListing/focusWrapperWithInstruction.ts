import {Observable as O} from 'rxjs'
import {div, h6, h5, h4} from '@cycle/dom'
import {targetIsOwner} from '../../../utils'

export default function main(sources, {component, title, instruction, skip_children}) {
  return {
    ...component,
    DOM: component.DOM.map(c => {
      return div('.appClickSection', [
        title && title.length ? h4({props: {"isTitle": true}}, [title]) : null,
        c
      ])
    }),
    focus$: O.merge(
      (component.focus$ || O.never()), 
      sources.DOM.select('.appClickSection').events('click')
        .filter(x => {
          if (!skip_children) {
            return true
          } else {
            return targetIsOwner(x) || x.target.isTitle === true
          }
        })
        .map(_ => {
          return instruction
        })
    )
  }
}