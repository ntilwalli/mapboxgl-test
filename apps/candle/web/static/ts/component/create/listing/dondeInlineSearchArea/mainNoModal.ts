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
import {inflateSession} from '../../../helpers/listing/utils'

import {model} from './modelNoModal'
import {main as VenueInput} from './venue/main'
import {createRegionAutocomplete} from '../../../../library/bootstrapRegionAutocomplete'

function SearchAreaComponent(sources, inputs) {

  const region_autocomplete = createRegionAutocomplete(sources, {
    ...inputs,
    props$: inputs.props$.pluck('region')
  })

  const change_r = sources.DOM.select('.appChangeButton').events('click')
    .map(_ => state => state.set('staged', undefined).set('expanded', true))
  const cancel_r = sources.DOM.select('.appCancelButton').events('click')
    .map(_ => state => state.update('staged', _ => state.get('search_area')).set('expanded', false))
  const search_area_r = region_autocomplete.output$.map(val => state => {
    return state.set('staged', {radius: 30000, region: val})
  })
  const done$ = sources.DOM.select('.appDoneButton').events('click')
    .publish().refCount()
  const done_r = done$
    .map(_ => state => {
      return state.update('search_area', _ => state.get('staged')).set('expanded', false)
    })

  const reducer$ = O.merge(change_r, cancel_r, search_area_r, done_r)
  const state$ = inputs.props$.switchMap(props => {
    return reducer$
      .startWith(Immutable.Map({
        expanded: false,
        staged: undefined,
        search_area: props
      }))
      .scan((acc, f: Function) => f(acc))
      .map((x: any) => x.toJS())
      .publishReplay(1).refCount()
  })
  const vtree$ = combineObj({
      state$,
      autocomplete: region_autocomplete.DOM
    })
    .map((info: any) => {
      const {expanded, staged, search_area} = info.state
      const {region} = search_area
      const {city_state} = region
      const {city, state_abbr} = city_state

      if (expanded) {
        return div('.row', [
          div('.col-xs-12.d-flex.fx-j-sb.fx-a-c', [
            div('.search-area-input', [info.autocomplete]),
            div('.d-flex.fx-a-c.fx-j-e', [
              staged ? button('.appDoneButton.btn.btn-link', ['Done']) : null,
              span('.appCancelButton.btn.btn-link.mr-xs', ['Cancel'])
            ])
          ])
        ])
      } else {
        return div('.row', [
          div('.col-xs-12.d-flex.fx-j-sb.fx-a-c', [
            `${city}, ${state_abbr}`,
            div('.appChangeButton.btn.btn-link', ['Change'])
          ])
        ])
      }
    })

  return {
    ...region_autocomplete, 
    DOM: vtree$,
    output$: done$.withLatestFrom(state$, (_, state) => state.staged)
      .publishReplay(1).refCount()
  }
}

function intent(sources, inputs) {
  const {DOM, Router} = sources

  const region$ = getPreferredRegion$(inputs)

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
    .map(inflateSession)
    .do(x => {
      console.log('session', x)
    })
    .publishReplay(1).refCount()
  
  return {
    session$
  }
}

function renderSearchArea(info) {
  const {components} = info
  return div(`.row`, [
    div('.col-xs-12', [
      div('.row', [
        h6('.col-xs-12', [`Search area`])
      ]),
      div('.row', [
        div('.col-xs-12', [
          components.search_area
        ])
      ])
    ])
  ])
}

function renderModeInput(info) {
  const {components} = info
  return div('.row.mt-1', [
    div('.col-xs-12', [
      div('.row', [
        h6('.col-xs-12', [`Venue`])
      ]),
      div('.row', [
        div('.col-xs-12', [
          components.input_component
        ])
      ])
    ])
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  }).map((info: any) => {
    const {components} = info
    return div(`.donde.row`, [
      div('.col-xs-12', [
        renderSearchArea(info),
        renderModeInput(info)
      ])
    ])
  })
}

// This component manages auto-saving
function main(sources, inputs) {
  const actions = intent(sources, inputs)
  const hide_modal$ = createProxy()
  const search_area$ = createProxy()
  const donde$ = createProxy()
  const search_area = SearchAreaComponent(sources, {...inputs, props$: actions.session$.map(x => x.properties.search_area)})
  const state$ = model(actions, {...inputs, search_area$: search_area.output$, donde$})


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
    search_area$: search_area.DOM,
    input_component$: input_component.DOM
  }

  const vtree$ = view(state$, components)
  const local = {
    DOM: vtree$,
  }

  const merged = mergeSinks(search_area, input_component)

  return {    
    ...merged,
    DOM: vtree$, 
    output$: state$
  }
}

export {
  main
}