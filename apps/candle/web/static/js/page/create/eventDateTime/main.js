import {Observable as O} from 'rxjs'
import view from './view'
import intent from './intent'
import model from './model'

import {div} from '@cycle/DOM'

import {combineObj, spread, normalizeComponent, createProxy} from '../../../utils'

import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import DateInput from '../../../library/dateInput/main'

function contentComponent(sources, inputs) {

  const actions = intent(sources)
  const rangeEndProxy$ = createProxy()
  const startDate = DateInput(sources, {
    props$: O.of({
      defaultNow: false,
      rangeStart: new Date()
    }),
    initialState$: actions.listing$.map(l => l.profile.time && l.profile.time.start),
    rangeStart$: O.never(),
    //rangeEnd$: O.never()
    rangeEnd$: rangeEndProxy$
  })

  const endDate = DateInput(sources, {
    props$: O.of({
      defaultNow: false
    }),
    initialState$: actions.listing$.map(l => l.profile.time && l.profile.time.end),
    //rangeStart$: O.never(),
    rangeStart$: startDate.result$,
    rangeEnd$: O.never()
  })

  rangeEndProxy$.attach(endDate.result$)


  const state$ = model(actions, spread(inputs, {
    listing$: actions.listing$,
    startDate$: startDate.result$,
    endDate$: endDate.result$
  }))

  const components = {
    startDate$: startDate.DOM,
    endDate$: endDate.DOM
  }

  const vtree$ = view(state$, components)



  return {
    DOM: vtree$,
    HTTP: O.never(),
    Global: O.merge(startDate.Global, endDate.Global),
    // O.merge(
    //   startDate.Global
    // ),
    state$
  }
}

export default function main(sources, inputs) {

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: true,
    next: `settings`,
    previous: listing => {
      const profile = listing.profile
      const location = profile.location
      if (location.mode === `address`) {
        return `confirmAddressLocation`
      } else {
        return `location`
      }
    }
  })

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps
  }))

  const headingGenerator = (saving$) => normalizeComponent(Heading(sources, spread(
    inputs, {
      saving$
    })))

  const instruction = {
    DOM: O.of(div([`Hello`]))
  }

  const workflowStep = Step(sources, spread(inputs, {
    headingGenerator, 
    content, 
    instruction, 
    props$: O.of({
      panelClass: `create-event-time`
    })
  }))

  return workflowStep
}
