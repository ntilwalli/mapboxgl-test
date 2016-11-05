import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import view from './view'
import intent from './intent'
import model from './model'

import AutocompleteInput from '../../../library/autocompleteInput'
import RadioInput from '../../../library/radioInput'
import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import {combineObj, spread, normalizeComponent, mergeSinks, createProxy, traceStartStop} from '../../../utils'

function contentComponent(sources, inputs) {

  const actions = intent(sources)
  const listing$ = actions.session$
    .map(x => x.listing)
    .publishReplay(1).refCount()
  const profile$ = actions.session$
    .map(x => x.listing)
    .map(listing => listing && listing.profile)
    .publishReplay(1).refCount()

  const creationTypeInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `Single`,
      value: `single`
    }, {
      displayValue: `Recurring`,
      value: `recurring`
    }
    // ,{
    //   displayValue: `Grouping`,
    //   value: `group`
    // }
    ],
    props$: listing$
      .map(listing => listing && listing.type)
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
    props$: listing$
      .map(listing => listing && listing.visibility)
      .map(selected => ({selected}))
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
      profile$.map(profile => profile 
        && profile.event_types 
        && profile.event_types.length
        && profile.event_types[0]),
      creationTypeInput.selected$.skip(1).filter(x => x === `group`).mapTo(undefined)
    ).map(selected => ({selected})),
  })

  // skip 1 because RadioInput emits based on props which is already used initially to set up the local state
  const state$ = model(
    actions, spread(
    inputs, {
      creationType$: creationTypeInput.selected$.skip(1),
      visibility$: visibilityInput.selected$.skip(1),
      eventType$: eventTypeInput.selected$.skip(1),
      session$: actions.session$
    })
  )

  const components = {
    creationTypeInput$: creationTypeInput.DOM,
    visibilityInput$: visibilityInput.DOM,
    eventTypeInput$: eventTypeInput.DOM
  }

  const vtree$ = view(state$.letBind(traceStartStop(`toView`)), components)

  const content = {
    DOM: vtree$,
    HTTP: O.never(),
    state$: state$.letBind(traceStartStop(`out`))
  }

  return content
}

export default function main(sources, inputs) {
  // {contentComponent, create, nextRequiresListingId, previous, next}

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresSessionId: false,
    previous: undefined,
    next: `description`
  })


  const session$ = createProxy()

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps,
    session$
  }))

  const headingGenerator = (saving$) => Heading(sources, spread(
    inputs, {
      saving$
    }))

  const instruction = {
    DOM: O.of(div([`Hello`]))
  }

  const workflowStep = Step(sources, spread(inputs, {
    headingGenerator, 
    content, 
    instruction, 
    props$: O.of({
      panelClass: `create-meta`
    })
  }))

  session$.attach(workflowStep.session$)

  return workflowStep
}
