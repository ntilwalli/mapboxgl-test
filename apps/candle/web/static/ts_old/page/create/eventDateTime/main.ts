import {Observable as O} from 'rxjs'
import view from './view'
import intent from './intent'
import model from './model'

import {div} from '@cycle/dom'

import {toMoment, combineObj, spread, normalizeComponent, createProxy} from '../../../utils'

import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import DateTimeInput from '../../../library/dateTimeInput/main'

function contentComponent(sources, inputs) {

  const actions = intent(sources, inputs)
  const rangeEndProxy$ = createProxy()
  const startDate = DateTimeInput(sources, {
    props$: O.of({
      defaultNow: false//,
      //rangeStart: new Date()
    }),
    initialState$: actions.listing$
      .map(l => l.profile.time && l.profile.time.start)
      .map(x => x && x.type === `datetime` ? x.data : undefined),
    rangeStart$: O.never(),
    //rangeEnd$: O.never()
    rangeEnd$: rangeEndProxy$
  })


  const endDate = DateTimeInput(sources, {
    props$: O.of({
      defaultNow: false
    }),
    initialState$: actions.listing$
      .map(l => l.profile.time && l.profile.time.end)
      .map(x => x && x.type === `datetime` ? x.data : undefined),
    date$: O.never(),
    // startDate.result$.skip(1).map(x => {
    //   return toMoment(x).add(2, `hours`).toDate()
    // }),
    rangeStart$: startDate.result$,
    rangeEnd$: O.never()
  })

  //actions.listing$.subscribe()

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
    next: `preview`,
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

  const listing$ = createProxy()

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps,
    listing$
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

  listing$.attach(workflowStep.listing$)

  return workflowStep
}
