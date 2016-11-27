import {Observable as O} from 'rxjs'
import {div, input} from '@cycle/dom'
import {combineObj} from '../../../../../utils'

export default function view(state$) {
  return state$.map(state => {
    return div(`.recurrence-input`, [

    ])
  })
}