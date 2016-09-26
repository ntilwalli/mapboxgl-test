import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, spread, mergeSinks, normalizeComponent} from '../../../utils'

import intent from './intent'
import model from './model'
import view from './view'
import mapview from './mapView'

import TextInput from '../../../library/textInput'
import Heading from '../../../library/heading/workflow/preview'
import Step from '../step/main'
import StepContent from '../stepContent/stagePost'

function contentComponent(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const vtree$ = view(state$)
  const listing$ = state$.map(x => x.listing)
  const toHTTP$ = O.merge(
    actions.post$.withLatestFrom(listing$, (_, listing) => listing)
      .map(listing => {
        return {
          url: `/api/user`,
          method: `post`,
          type: `json`,
          send: {
            route: `/listing/post`,
            data: listing
          },
          category: `postListing`
        }
      }),
    actions.stage$.withLatestFrom(listing$, (_, listing) => listing)
      .map(listing => {
        return {
          url: `/api/user`,
          method: `post`,
          type: `json`,
          send: {
            route: `/listing/stage`,
            data: listing
          },
          category: `stageListing`
        }
      })
  )

  const toRouter$ = O.merge(
    actions.postSuccess$.map(x => x.data).map(listing => {
      return {
        pathname: `/create/${listing.id}/postSuccess`,
        action: `PUSH`,
        state: listing
      }
    }),
    actions.stageSuccess$.map(x => x.data).map(listing => {
      return {
        pathname: `/create/${listing.id}/stageSuccess`,
        action: `PUSH`,
        state: listing
      }
    })
  )

  return normalizeComponent({
    DOM: vtree$,
    MapDOM: mapview(state$),
    HTTP: toHTTP$,
    Router: toRouter$
  })
}

export default function main(sources, inputs) {
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