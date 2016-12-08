import {Observable as O} from 'rxjs'
import {div, span, input, select, option} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'

function render(check_in, components) {

    return div('.column', [
      div('.row.align-center.small-margin-bottom', [
        span('.sub-sub-heading.align-center', ['Begins']),
        span('.item', [components.begins]),
        span('.item.align-center', ['minutes before event start']),
      ]),
      div('.row.align-center.small-margin-bottom', [
        span('.sub-sub-heading.align-center', ['Ends']),
        span(`.item`, [components.ends_time_type]),
        components.ends
      ]),
      div('.row.align-center', [
        span('.sub-sub-heading.align-center', ['Radius']),
        span('.item', [components.radius]),
        span('.item', ['meters'])
      ])
    ]) 
}

export default function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    })
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      const {check_in} = state
      //console.log('components', components)
      return div('.column.check-in', [
        div('.sub-heading.section-heading ', ['Check-in']),        
        div('.column', [
          render(check_in, components)
        ])
      ])
    })
}