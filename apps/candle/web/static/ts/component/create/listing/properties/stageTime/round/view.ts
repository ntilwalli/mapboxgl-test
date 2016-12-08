import {Observable as O} from 'rxjs'
import {div, span, input, select, option} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'

function render(cost, components) {

    return div('.column.margin-bottom', [
      span('.item', [components.type]),
      components.cover ? div('.row.align-center.small-margin-bottom', [
        span('.sub-heading.align-center', ['Cover']),
        span(`.item.number-input`, [components.cover])
      ]) : null,
      components.minimum_purchase ? div('.row.align-center', [
        span('.sub-heading.align-center', ['Minimum purchase']),
        span('.item', [components.minimum_purchase]),
      ]) : null
    ]) 
}

export default function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    })
    .map(x => {
      return x
    })
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      const {cost} = state
      //console.log('components', components)
      return div('.column.cost', [
        div('.sub-heading.section-heading ', ['Cost']),        
        div('.column', [
          render(cost, components)
        ])
      ])
    })
}