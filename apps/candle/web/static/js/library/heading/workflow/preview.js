import {Observable as O} from 'rxjs'
import {div, span, a, button} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, normalizeComponent, renderExternalLink, spread, mergeSinks, attrs} from '../../../utils'
import moment from 'moment'

import Logo from '../logo'

function intent(sources, inputs) {
  const {DOM, Router, Heartbeat} = sources
  const save$ = DOM.select(`.appSaveListing`).events(`click`).publish().refCount()
  const listing$ = Router.history$.map(x => x.state)
  const instruction$ = inputs.ParentRouter.define([
    {pattern: `/meta`, value: `Preliminary info`},
    {pattern: `/description`, value: `Add a title and description`},
    {pattern: `/location`, value: `Add a location`},
    {pattern: `/confirmAddressLocation`, value: `Confirm address location`},
    {pattern: `/time`, value: `Set event time`},
    {pattern: `/recurrence`, value: `Set recurrence`},
    {pattern: `/properties`, value: `Properties and handle`},
    {pattern: `/preview`, value: `Post, stage or customize`},
    {pattern: `*`, value: `Step default: Should not get here`}
  ]).map(x => {
    return x.value.info
  })

  return {
    save$,
    instruction$,
    listing$,
    Heartbeat
  }
}

function reducers(actions, inputs) {
  const savingR = inputs.saving$.map(val => state => {
    if (val.type === `saving`) {
      return state.set(`isSaving`, true).set(`error`, undefined)
    } else if (val.type === `saved`) {
      return state.set(`lastSaved`, val.data.updated_at).set(`isSaving`, false).set(`error`, undefined)
    } else if (val.type === `created`) {
      return state.set(`lastSaved`, val.data.inserted_at).set(`isSaving`, false).set(`error`, undefined)
    } else if (val.type === `error`) {
      return state.set(`error`, val.data)
    } else if (val.type === `problem`) {
      return state.set(`error`, val.data)
    }
  })

  const heartbeatR = actions.Heartbeat.map(() => state => state)

  return O.merge(savingR, heartbeatR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})

  return combineObj({
    listing$: actions.listing$.take(1)//.map(x => x && x.updatedAt).take(1)
  })
    .map(inputs => {
      const {listing} = inputs
      return {
        instruction: `Post, stage or customize`,
        lastSaved: listing && listing.updated_at,
        error: undefined,
        isSaving: false
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc)))
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}

function renderInstruction(state) {
  return div(`.step-description`, [
    state.instruction
  ])
}

function renderSaveArea(state) {
  const {lastSaved, isSaving, error} = state
  if (error) {
    console.error("Save listing error: ", error)
  }
  //console.log("Last saved", lastSaved)

  return div(`.listing-save-area`, [
    !error ? div(`.last-saved-status`, [
      isSaving ? span(`.spinner`) : div([lastSaved ? moment(lastSaved).fromNow() : `Not saved`])
    ]) : div(`.error-save-status`, [`Error`]),
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
  
  const actions = intent(sources, inputs)
  const state$ = model(actions, inputs)
  const components = {
    logo$: logo.DOM
  }
  const vtree$ = view(state$, components)
  return normalizeComponent({
    DOM: vtree$,
    Router: O.merge(logo.Router, actions.save$.mapTo(`/`).delay(4)),
    message$: logo.message$,
    save$: actions.save$
  })
}