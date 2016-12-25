import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {normalizeComponent, mergeSinks, componentify} from '../../../../utils'
import intent from './intent'


import Recurrence from './recurrence/main'
import Single from './single/main'
//import RecurrenceCalendar from './recurrenceCalendar/main'

export function main(sources, inputs) {
  const actions = intent(sources)
  const screen$ = actions.session$.map(session => {
    if (session.listing.type === `single`) {
      return Single(sources, inputs)
    } else {
      return Recurrence(sources, inputs)
    }
  }).publishReplay(1).refCount()

  const screen = componentify(screen$)
  const merged = mergeSinks(screen)

  return {
    ...merged,
    DOM: screen.DOM, 
    output$:  screen$.switchMap(screen => {
      return screen.output$
    })
  }
}