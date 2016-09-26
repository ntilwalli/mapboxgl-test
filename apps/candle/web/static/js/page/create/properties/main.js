import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, spread, mergeSinks, normalizeComponent} from '../../../utils'

import intent from './intent'
import model from './model'
import view from './view'

import TextInput from '../../../library/textInput'
import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

const userHandleInputProps = O.of({
  placeholder: `Handle`,
  name: `handle`,
  required: false,
  key: `handle`
})

const globalHandleInputProps = O.of({
  placeholder: `Global handle`,
  name: `globalHandle`,
  required: false,
  key: `globalHandle`
})

function contentComponent(sources, inputs) {
  const actions = intent(sources)
  const titleInput = TextInput(sources, {
    props$: titleInputProps, 
    error$: O.never(),
    initialText$: actions.listing$.map(x => x.profile && x.profile.description && x.profile.description.title)
  })
  const state$ = model(actions, spread(inputs, {
    title$: titleInput.value$,
    listing$: actions.listing$
  }))

  const components = {
    titleInput$: titleInput.DOM
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    HTTP: O.never(),
    state$
  }
}

export default function main(sources, inputs) {
  // {contentComponent, create, nextRequiresListingId, previous, next}

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: true,
    previous: `meta`,
    next: `location`
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
      panelClass: `create-description`
    })
  }))

  return workflowStep
}