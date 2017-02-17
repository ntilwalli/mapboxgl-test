import {Observable as O} from 'rxjs'
import {div, small, button, li, nav, span, select, input, option, label, h6, h4} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {
  combineObj, 
  createProxy, 
  mergeSinks, 
  processHTTP, 
  traceStartStop, 
  getPreferredRegion$,
  onlyError, 
  onlySuccess,
  componentify,
  normalizeArcGISSingleLineToParts,
  globalUID
} from '../utils'
import ArcGISSuggest from '../thirdParty/ArcGISSuggest'
import ArcGISGetMagicKey from '../thirdParty/ArcGISGetMagicKey'
import AutocompleteInput from '../library/bootstrapAutocompleteInput'
import {createRegionAutocomplete} from '../library/bootstrapRegionAutocomplete'

import deepEqual = require('deep-equal')
import clone = require('clone')

function BlankComponent() {
  return {
    DOM: O.of(div([])),
    output$: O.never()
  }
}

function intent(sources, guid) {
  const {DOM, MessageBus} = sources

  const clear_region$ = DOM.select('.appClearRegion').events('click')
  const reset_region$ = DOM.select('.appResetRegion').events('click')
  const click_input$ = DOM.select('.appInputArea').events('click')
  const click_elsewhere$ = DOM.select('body').events('click')
    .map(x => {
      return x
    })
    .filter(ev => {
      return ev.guid !== guid
    })
    
  return {
    clear_region$,
    reset_region$,
    click_elsewhere$,//: O.never(),
    add_event_guid$: O.merge(click_input$)
      .map(ev => ({
        event: ev,
        guid
      }))
  }
}

function reducers(actions, inputs) {
  const clear_region_r = actions.clear_region$.map(_ => state => {
    return state.set('show_autocomplete', true)
  })

  const click_elsewhere_r = actions.click_elsewhere$.map(_ => state => {
    return state.set('show_autocomplete', false)
  })

  const region_r = inputs.region$.map(region => state => {
    return state.set('region', region).set('show_autocomplete', false)
  })

  const reset_region_r = actions.reset_region$.map(_ => state => {
    const fallback_region = state.get('fallback_region')
    return state.set('region', fallback_region)
  })

  const waiting_r = inputs.waiting$.map(_ => state => {
    return state.set('waiting', true)
  })

  return O.merge(
    clear_region_r, 
    region_r,
    reset_region_r,
    waiting_r,
    click_elsewhere_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const preferred_region$ = getPreferredRegion$(inputs)
  return combineObj({
      fallback_region$: preferred_region$.take(1),
      props$: inputs.props$.take(1)
    })
    .switchMap((info: any) => {
      const {fallback_region, props} = info

      return reducer$
        .startWith(Immutable.fromJS({
          region: props || fallback_region, 
          fallback_region, 
          show_autocomplete: false, 
          waiting: false
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`component/settings state`, x))
    //.letBind(traceStartStop(`component/settings state trace`))
    .publishReplay(1).refCount()
}

function renderRegion(info, guid) {
  const {state, components} = info
  const {region, fallback_region, show_autocomplete} = state
  if (!show_autocomplete) {
    const {position, city_state} = region
    const {city, state_abbr} = city_state

    const is_fallback = deepEqual(fallback_region.city_state, region.city_state)
    return div(`.d-flex`, {class: {'justify-content-between': true, appInputArea: true}}, [
      div('.d-flex', [
        span([`${city}, ${state_abbr}`]),
        !is_fallback ? button('.appResetRegion.btn.btn-link.ml-4', [small(['Reset to preferred'])]) : null
      ]),
      div('.d-flex', [
        button(`.appClearRegion.btn.btn-link.close`, {attrs: {type: 'button'}}, [])
      ])
    ])
  } else {
    const {autocomplete} = components
    return div('.d-flex', {class: {appInputArea: true}}, [
      div('.d-flex', {class: {'w-100': true}}, [autocomplete])
    ])
  }
}

function view(state$, components, guid) {
  return combineObj({
      state$,
      components$: combineObj(components)
    })
    .map((info: any) => {
      return renderRegion(info, guid)
    })
}


export default function main(sources, inputs) {
  const guid = globalUID()
  const actions = intent(sources, guid)

  const region$ = createProxy()
  const waiting$ = createProxy()
  const state$ = model(actions, {
    ...inputs, 
    region$,
    waiting$
  })

  // const autocomplete$: any = state$
  //   .pluck('show_autocomplete')
  //   .distinctUntilChanged()
  //   .map(show => {
  //     if (show) {
  //       return isolate(createRegionAutocomplete)(sources, inputs)
  //     } else {
  //       return BlankComponent()
  //     }
  //   }).publishReplay(1).refCount() 

  const autocomplete: any = isolate(createRegionAutocomplete)(sources, inputs)//componentify(autocomplete$, 'output$')

  region$.attach(autocomplete.output$)
    

  const components = {
    autocomplete$: autocomplete.DOM
  }

  const vtree$ = view(state$, components, guid)

  const merged = mergeSinks(autocomplete)
  return {
    ...merged,
    DOM: vtree$,
    Global: actions.add_event_guid$.map(data => {
      return {
        type: 'addEventGuid',
        data
      }
    }),
    output$: state$.pluck('region')
      .distinctUntilChanged((x, y) => deepEqual(x, y))
  }
}
