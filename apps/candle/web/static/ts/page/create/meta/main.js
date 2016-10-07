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

import {combineObj, spread, normalizeComponent, mergeSinks, createProxy} from '../../../utils'

function contentComponent(sources, inputs) {

  const actions = intent(sources)
  const profile$ = actions.listing$
    .map(x => {
      return x
    })
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
    props$: actions.listing$
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
    props$: profile$
      .map(profile => ({selected: profile.meta && profile.meta.visibility}))
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
      profile$.map(profile => profile.meta && profile.meta.eventType),
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
      listing$: actions.listing$
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
    HTTP: O.never(),
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


  const listing$ = createProxy()

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps,
    listing$
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

  listing$.attach(workflowStep.listing$)

  return workflowStep
}
