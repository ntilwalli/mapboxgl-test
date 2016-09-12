import {Observable as O} from 'rxjs'
import view from './view'
import mapView from './mapView'
import intent from './intent'
import model from './model'
import Immutable from 'immutable'

import {div, li, span} from '@cycle/DOM'

import {noopListener, normalizeSink, normalizeSinkUndefined, spread, combineObj} from '../../../utils'

function contentComponent(sources, inputs) {

  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  const mapvtree$ = mapView(state$)

  return {
    DOM: vtree$,
    MapDOM: mapvtree$,
    state$
  }
}

export default function main(sources, inputs) {

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: true,
    previous: `location`,
    next: `time`
  })

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps
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

  return workflowStep
}
