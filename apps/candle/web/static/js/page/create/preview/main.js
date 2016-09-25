import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, spread, mergeSinks, normalizeComponent} from '../../../utils'

import intent from './intent'
import model from './model'
import view from './view'
import mapview from './mapView'

import TextInput from '../../../library/textInput'
import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/stagePost'
//import StepContent from '../stepContent/standard'


function contentComponent(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, spread(inputs, {
    listing$: actions.listing$
  }))

  const components = {
    //titleInput$: titleInput.DOM
  }

  const vtree$ = view(state$, components)

  return normalizeComponent({
    DOM: vtree$,
    MapDOM: mapview(state$),
    state$
  })
}

export default function main(sources, inputs) {
  // {contentComponent, create, nextRequiresListingId, previous, next}
  console.log(`Hey`)
  const stepProps = O.of({
    contentComponent,
    previous: (listing) => {
      if (listing.type === `recurring`) {
        return `recurrence`
      } else {
        return `time`
      }
    }
  })

  // const stepProps = O.of({
  //   contentComponent,
  //   create: false,
  //   nextRequiresListingId: false,
  //   previous: undefined,
  //   next: `description`
  // })


  const content = StepContent(sources, spread(inputs, {
    props$: stepProps
  }))

  //const content = contentComponent(sources, inputs)

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
      panelClass: `create-description`
    })
  }))

  return workflowStep
}