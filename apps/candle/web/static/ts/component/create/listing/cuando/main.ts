import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {normalizeComponent, componentify} from '../../../../utils'
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

  const components = {
    screen$: screen$.switchMap(x => {
      return x.DOM
    })
  }

  const out = {
    DOM: screen$.switchMap(screen => screen.DOM)
  }

  const normalized = normalizeComponent(out)

  return {
    ...normalized, 
    output$:  screen$.switchMap(screen => {
      return screen.output$
    })
  }
}