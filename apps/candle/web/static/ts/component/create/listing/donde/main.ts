import {Observable as O} from 'rxjs'
import {div, h5, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, getPreferredRegion$, mergeSinks, normalizeSink, normalizeComponent, componentify, createProxy} from '../../../../utils'
import {renderMenuButton, renderCircleSpinner, renderLoginButton, renderSearchCalendarButton} from '../../../renderHelpers/navigator'
import clone = require('clone')

import {model} from './model'
import {main as getModal} from './getModal'
import DoneModal from '../../../../library/doneModal'
import SearchArea from './searchArea/main'
import {main as VenueInput} from './venue/main'

function intent(sources, inputs) {
  const {DOM, Router} = sources

  const region$ = getPreferredRegion$(inputs)
  const show_search_area_screen$ = DOM.select(`.appChangeSearchAreaButton`).events(`click`)
  
  const session$ = combineObj({
    region$,
    session$: Router.history$.pluck(`state`).pluck(`data`)
  }).map((info: any) => {
    const {region, session} = info
    
    session.listing.donde = session.listing.donde || undefined
    session.properties.search_area = session.properties.search_area || {
      region,
      radius: 30000
    }

    return session
  })
  
  return {
    session$,
      //.do(x => console.log(`session`, x)),
    show_search_area_screen$
  }
}

function renderSearchArea(info) {
  const {state} = info
  const {session} = state
  const {properties} = session
  const {search_area} = properties
  const {region} = search_area
  const {city_state} = region
  const {city, state_abbr} = city_state
  const sa = `${city}, ${state_abbr}`

  return div(`.search-area.section`, [
    div(`.heading`, [`Search area`]),
    div(`.content`, [
      span([sa]),
      span(`.change-button`, [
        button(`.appChangeSearchAreaButton.text-button`, [`change`])
      ])  
    ])
  ])
}

function renderModeInput(info) {
  const {components} = info
  return div(`.mode-input.section`, [
    components.input_component
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  }).map((info: any) => {
    const {components} = info
    return div(`.donde`, [
      renderSearchArea(info),
      renderModeInput(info),
      components.modal
    ])
  })
}

// This component manages auto-saving
function main(sources, inputs) {
  const actions = intent(sources, inputs)
  const hide_modal$ = createProxy()
  const search_area$ = createProxy()
  const donde$ = createProxy()

  const state$ = model(actions, {...inputs, hide_modal$, search_area$, donde$})

  const modal$ = state$
    .distinctUntilChanged((x: any, y: any) => {
      return x.modal === y.modal
    })
    .map((state: any) => getModal(sources, inputs, {modal: state.modal, session: state.session}))
    .publishReplay(1).refCount()

  hide_modal$.attach(normalizeSink(modal$, `close$`))
  search_area$.attach(normalizeSink(modal$, `done$`))

  const input_component$ = state$.pluck(`mode`)
    .distinctUntilChanged()
    .map(mode => {
      if (mode === `venue`) {
        const out = VenueInput(sources, {
          ...inputs, 
          search_area$: state$.map((state: any) => state.session.properties.search_area),
          props$: state$.map((state: any) => state.session.listing.donde)
        })

        return out
      } else {
        throw new Error(`Invalid mode ${mode}`)
      }
    }).publishReplay(1).refCount()

  donde$.attach(input_component$.switchMap(x => x.output$)) 
 
  const components = {
    modal$: modal$.switchMap((x: any) => x.DOM),
    input_component$: input_component$.switchMap((x: any) => x.DOM)
  }

  const vtree$ = view(state$, components)
  const local = {
    DOM: vtree$,
  }

  const out = {
    DOM: vtree$,
    HTTP: O.merge(modal$.switchMap((x: any) => x.HTTP), input_component$.switchMap((x: any) => x.HTTP)),
    MapJSON: O.merge(modal$.switchMap((x: any) => x.MapJSON), input_component$.switchMap((x: any) => x.MapJSON)).publish().refCount(), 
    Global: input_component$.switchMap((x: any) => x.Global), 
  }

  const normalized = normalizeComponent(out)

  return {...normalized, output$: state$}
}

export {
  main
}