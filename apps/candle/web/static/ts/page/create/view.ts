import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj} from '../../utils'

export default function view(state$, workflow$) {
  return combineObj({state$, workflow$})
    .map(({state, workflow}: any) => {
    // return state$.map(state => {
      if (state.waiting) {
        return div(`.create-component`, [
          `Waiting`
        ])
      } else {
        return div(`.create-component`, [
          div([`Stuff`])
        ])
      }
    })
}
