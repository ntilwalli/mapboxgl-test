import {Observable as O} from 'rxjs'
import view from './view'
import intent from './intent'
import model from './model'
import {RRule} from 'rrule'

import {div} from '@cycle/DOM'

import {combineObj, spread, normalizeComponent, createProxy} from '../../../utils'

import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import RadioInput from '../../../library/radioInput'

import DateInput from '../../../library/dateInput/main'



function contentComponent(sources, inputs) {

  const actions = intent(sources)

  const frequencyInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `Weekly`,
      value: RRule.WEEKLY.toString()
    },{
      displayValue: `Monthly`,
      value: RRule.MONTHLY.toString()
    }],
    props$: actions.listing$
      .map(listing => {
        return listing && listing.profile && 
               listing.profile.time && 
               listing.profile.time.rrule && 
               listing.profile.time.rrule.freq 
      })
      .map(freq => ({selected: freq ? freq.toString() : undefined}))
  })




  const state$ = model(actions, spread(inputs, {
    frequency$: frequencyInput.selected$,
    listing$: actions.listing$
  }))

  const components = {
    frequency$: frequencyInput.DOM
  }

  const vtree$ = view(state$, components)



  return {
    DOM: vtree$,
    HTTP: O.never(),
    Global: O.never(),
    state$: state$
    .do(x => console.log(`to state out`, x))
    .map(x => {
      return x
    }).publishReplay(1).refCount()
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
