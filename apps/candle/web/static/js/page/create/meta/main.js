import {Observable as O} from 'rxjs'
import {div} from '@cycle/DOM'
import view from './view'
import intent from './intent'
import model from './model'

import AutocompleteInput from '../../../library/autocompleteInput'
import RadioInput from '../../../library/radioInput'
import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import {getEmptyListing} from '../listing'

import {combineObj, spread, normalizeComponent, mergeSinks} from '../../../utils'

function contentComponent(sources, inputs) {
  const listing$ = sources.Router.history$
    .map(route => route.state || getEmptyListing())
    .cache(1)

  const meta$ = listing$
    .map(listing => listing && listing.meta)
    .cache(1)

  const creationTypeInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `Single`,
      value: `single`
    }, {
      displayValue: `Recurring`,
      value: `recurring`
    }, {
      displayValue: `Custom grouping`,
      value: `group`
    }],
    props$: meta$
        .map(x => {
          return x
        })
        .map(meta => meta && meta.creationType)
        .map(selected => ({selected}))
  })

  const visibilityInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `Public`,
      value: `public`
    },{
      displayValue: `Private`,
      value: `private`
    }, {
      displayValue: `Hidden`,
      value: `hidden`
    }
    // , {
    //   displayValue: `Secret`,
    //   value: `secret`
    // }
    ],
    props$: meta$
      .map(meta => ({selected: meta && meta.visibility}))
  })

  const eventTypeInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `Gathering`,
      value: `gathering`
    },{
      displayValue: `Show`,
      value: `show`
    }, {
      displayValue: `Rendezvous`,
      value: `rendezvous`
    }
    //, {
    //   displayValue: `Moment`,
    //   value: `moment`
    // }
    ],
    props$: O.merge(
      meta$.map(meta => meta && meta.eventType),
      creationTypeInput.selected$.skip(1).filter(x => x === `group`).mapTo(undefined)
    ).map(selected => ({selected})),
  })

  const actions = intent(sources)
  // skip 1 because RadioInput emits based on props which is already used initially to set up the local state
  const state$ = model(
    actions, spread(
    inputs, {
      creationType$: creationTypeInput.selected$.skip(1),
      visibility$: visibilityInput.selected$.skip(1),
      eventType$: eventTypeInput.selected$.skip(1),
      listing$
    })
  )

  const components = {
    creationTypeInput$: creationTypeInput.DOM,
    visibilityInput$: visibilityInput.DOM,
    eventTypeInput$: eventTypeInput.DOM
  }

  const vtree$ = view(state$, components)

  const content = {
    DOM: vtree$,
    state$
  }

  return content
}

export default function main(sources, inputs) {
  // {contentComponent, create, nextRequiresListingId, previous, next}

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: false,
    previous: undefined,
    next: `description`
  })

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps
  }))

  const heading = normalizeComponent(Heading(sources, spread(
    inputs, {
      saving$: O.never()
    })))

  const instruction = {
    DOM: O.of(div([`Hello`]))
  }

  const workflowStep = Step(sources, spread(inputs, {
    heading, 
    content, 
    instruction, 
    props$: O.of({
      panelClass: `create-meta`
    }),
    save$: O.merge(heading.save$, content.save$)
  }))

  return workflowStep
}
