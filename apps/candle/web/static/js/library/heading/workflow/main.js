import {Observable as O} from 'rxjs'
import {div, span, a, button} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, normalizeComponent, renderExternalLink, spread, mergeSinks, attrs} from '../../../utils'

import Logo from '../logo'

function intent(sources) {
  const {DOM, Router} = sources
  const save$ = DOM.select(`.appSaveListing`).events(`click`)
  const listing$ = Router.history$.map(x => x.state)
  const instruction$ = Router.define([
    {pattern: `/meta`, value: `Step 1: Preliminary info`},
    {pattern: `/description`, value: `Step 2: Add a title and description`},
    {pattern: `*`, value: `Step default: Should not get here`}
  ]).map(x => {
    return x.value
  })

  return {
    save$,
    instruction$,
    listing$
  }
}

function reducers(actions, inputs) {
  const savingR = inputs.saving$.map(val => state => {
    if (val.type === `saving`) {
      return state.set(`isSaving`, true)
    } else if (val.type === `saved` || val.type === `error`) {
      return state.set(`lastSaved`, val.data).set(`isSaving`, false)
    }
  })

  return O.merge(savingR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})

  return combineObj({
    instruction$: actions.instruction$.take(1),
    lastSaved$: actions.listing$.map(x => x && x.lastUpdated).take(1)
  })
    .map(inputs => {
      const {instruction, lastSaved} = inputs
      return {
        instruction,
        lastSaved,
        isSaving: false
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc)))
    .map(x => x.toJS())
    .cache(1)
}

function renderInstruction(state) {
  return div(`.step-description`, [
    state.instruction
  ])
}

function renderSaveArea(state) {
  const {lastSaved, isSaving} = state
  return div(`.listing-save-area`, [
    div(`.hidden-sm-down.last-saved-status`, [
      isSaving ? span(`.spinner`) : div([lastSaved ? lastSaved : `Not saved`])
    ]),
    button(`.appSaveListing.menu-link`, [`Save and Exit`])
  ])
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)}).map(inputs => {
    const {state, components} = inputs
    const {logo} = components
    return div(`.page-heading`, [
      logo,
      div(`.create-workflow`, [
        renderInstruction(state),
        renderSaveArea(state)
      ])
    ])
  })
}

function validateInputs(inputs) {
  if (!inputs.saving$) {
    throw new Error(`Workflow heading requires saving$`)
  }
}

export default function main(sources, inputs) {
  validateInputs(inputs)
  const logo = Logo(sources, inputs)
  
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const components = {
    logo$: logo.DOM
  }
  const vtree$ = view(state$, components)
  return normalizeComponent({
    DOM: vtree$,
    Router: logo.Router,
    message$: logo.message$,
    save$: actions.save$
  })
}
