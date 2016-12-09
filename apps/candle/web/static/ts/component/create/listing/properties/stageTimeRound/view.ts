import {Observable as O} from 'rxjs'
import {div, span, input, select, option} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'

// function render(cost, components) {

//     return div('.column.margin-bottom', [
//       span('.item', [components.type]),
//       components.minutes ? div('.row.align-center.small-margin-bottom', [
//         span('.sub-heading.align-center', ['Cover']),
//         span(`.item.number-input`, [components.minutes])
//       ]) : null,
//       components.songs ? div('.row.align-center', [
//         span('.sub-heading.align-center', ['']),
//         span('.item', [components.songs]),
//       ]) : null
//     ]) 
// }

function render(cost, components) {
  const both = components.minutes && components.songs

  const minutes_heading = !!both ? span('.sub-sub-heading.align-center', ['Minutes']) : null
  const songs_heading = !!both ? span('.sub-sub-heading.align-center', ['Songs']) : null
  return div({class: {row: !both, column: both}}, [
    span('.item', [components.type]),
    components.minutes ? div(`.row.align-center.small-margin-bottom`, [
      minutes_heading, 
        span('.row', [
          components.minutes
        ])
    ]) : null,
    components.songs ? div('.row.align-center', [
      songs_heading,
        span('.row', [
          components.songs
        ])
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
      return div('.column.stage-time', [
        //div('.sub-heading.section-heading ', ['Stage time']),        
        div('.column', [
          render(cost, components)
        ])
      ])
    })
}