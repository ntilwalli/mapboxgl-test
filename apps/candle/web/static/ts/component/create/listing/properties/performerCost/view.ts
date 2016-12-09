import {Observable as O} from 'rxjs'
import {div, span, input, select, option} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'


function render(cost, components) {
  const both = components.cover && components.minimum_purchase
  return div({class: {row: !both, column: both}}, [
    span(`.item`, {class: {'small-margin-bottom': both}}, [components.type]),
    components.cover ? div(`.row.align-center.small-margin-bottom`, [
      both ? span('.sub-sub-heading.align-center', ['Cover']) : null,
      span(`.item`, [span('.row', [span('.item', [components.cover]), span('.item.flex.align-center', ['dollars'])])])
    ]) : null,
    components.minimum_purchase ? div('.row.align-center', [
      both ? span('.sub-sub-heading.align-center', ['Minimum purchase']) : null,
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
        div('.sub-heading.section-heading ', ['Performer cost']),        
        render(cost, components)
      ])
    })
}