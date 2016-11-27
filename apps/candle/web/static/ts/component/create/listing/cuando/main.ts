import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {normalizeComponent} from '../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'

import RecurrenceInput from './recurrenceInput/main'
import RecurrenceCalendar from './recurrenceCalendar/main'

export function main(sources, inputs) {
  const actions = intent(sources)
  const cuando$ = O.never()
  const state$ = model(actions, {...inputs, cuando$})
  const components = {}
  const vtree$ = view(state$, components)

  const out = {
    DOM: vtree$,
  }

  const normalized = normalizeComponent(out)

  return {
    ...normalized, 
    session$: state$.pluck(`session`), 
    valid$: state$.pluck(`valid`).distinctUntilChanged()
  }
}