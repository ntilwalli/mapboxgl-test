import {Observable as O} from 'rxjs'
import {div, h6, span, button, label} from '@cycle/dom'
import Immutable = require('immutable')
import {
  combineObj, getPreferredRegion$, mergeSinks, normalizeSink, 
  normalizeComponent, componentify, createProxy} from '../../../../utils'
import {
  renderMenuButton, 
  renderCircleSpinner, 
  renderLoginButton, 
  renderSearchCalendarButton
} from '../../../helpers/navigator'
import clone = require('clone')
import {inflateDates} from '../../../helpers/listing/utils'

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
    .map(inflateDates)
  
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

  return div(`.form-group`, [
    h6([`Search area`]),
    div(`.col-form-static`, [
      span([sa]),
      span(`.appChangeSearchAreaButton.btn.btn-link.ml-1.v-align-initial`, [`change`])
    ])
  ])
}

function renderModeInput(info) {
  const {components} = info
  return div(`.form-group`, [
    h6([`Venue`]),
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

  const modal = componentify(modal$)

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
  
  const input_component = componentify(input_component$)

  donde$.attach(input_component$.switchMap((x: any) => x.output$)) 
 
  const components = {
    modal$: modal.DOM,
    input_component$: input_component.DOM
  }

  const vtree$ = view(state$, components)
  const local = {
    DOM: vtree$,
  }

  const merged = mergeSinks(modal, input_component)

  return {    
    ...merged,
    DOM: vtree$, 
    output$: state$
  }
}

export {
  main
}