import {Observable as O} from 'rxjs'
import view from './view'
import mapview from './mapview'
import intent from './intent'
import model from './model'
import Immutable = require('immutable')

import {div, li, span} from '@cycle/dom'

import {createProxy, normalizeSink, normalizeSinkUndefined, normalizeComponent, spread, combineObj} from '../../../utils'

import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

function contentComponent(sources, inputs) {

  const actions = intent(sources)
  const state$ = model(actions, spread(inputs, {
    listing$: actions.listing$
  }))
  const vtree$ = view(state$)
  const mapvtree$ = mapview(state$)

  return {
    DOM: vtree$,
    MapJSON: mapvtree$,
    HTTP: O.never(),
    state$
  }
}

export default function main(sources, inputs) {

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: true,
    previous: `location`,
    next: listing => {
      const profile = listing.profile
      const location = profile.location
      if (listing.type === `recurring`) {
          return `recurrence`
        } else {
          return `time`
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
    DOM: O.of(div([`Location info`]))
  }

  const workflowStep = Step(sources, spread(inputs, {
    headingGenerator, 
    content, 
    instruction, 
    props$: O.of({
      panelClass: `create-location`
    })
  }))

  listing$.attach(workflowStep.listing$)

  return workflowStep
}
