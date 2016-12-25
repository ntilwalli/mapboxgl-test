import {Observable as O} from 'rxjs'
import {div, button, li, nav, span, select, input, option, label, h6} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, processHTTP, traceStartStop, onlyError, onlySuccess, normalizeArcGISSingleLineToParts} from '../../utils'
import {renderMenuButton, renderCircleSpinner, renderLoginButton, renderUserProfileButton, renderSearchCalendarButton} from '../helpers/navigator'
import ArcGISSuggest from '../../thirdParty/ArcGISSuggest'
import ArcGISGetMagicKey from '../../thirdParty/ArcGISGetMagicKey'
import AutocompleteInput from '../../library/bootstrapAutocompleteInput'
import {createRegionAutocomplete} from '../../library/bootstrapRegionAutocomplete'
import clone = require('clone')

function intent(sources) {
  const {DOM, MessageBus} = sources
  const {success$, error$} = processHTTP(sources, `setApplicationSettings`)
  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)

  const region_type$ = DOM.select(`.appRegionComboBox`).events(`change`)
    .map(ev => ev.target.value)

  const clear_default_region$ = DOM.select(`.appClearDefaultRegion`).events(`click`)

  const save_changes$ = DOM.select(`.appSaveChanges`).events(`click`).publish().refCount()
  const saved$ = MessageBus.address(`/component/settings`)
    //.do(x => console.log(`saved$:`, x))
    .publish().refCount()

  return {
    success$: success$.publish().refCount(),
    error$,
    got_response$: O.merge(success$, error$),
    show_menu$,
    brand_button$,
    region_type$,
    clear_default_region$,
    save_changes$,
    saved$
  }
}

function getValidity({default_region}) {
  return !!default_region 
}

function reducers(actions, inputs) {
  const region_type_r = actions.region_type$.map(x => state => {
    const settings = state.get(`settings`)
    settings.use_region = x
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  const clear_default_region_r = actions.clear_default_region$.map(_ => state => {
    const settings = state.get(`settings`)
    settings.default_region = undefined
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  const default_waiting_r = inputs.default_waiting$.skip(1).map(x => state => {
    return state.set(`default_waiting`, x)
  })

  const default_region_r = inputs.default_region$.map(x => state => {
    const settings = state.get(`settings`)
    settings.default_region = x
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  const success_r = actions.saved$.map(x => state => {
    return state
      .set(`save_status`, {type: `success`, data: `Settings saved`})
      .set(`save_waiting`, false)
      .set(`settings`, x)
  })

  const error_r = actions.error$.map(x => state => {
    return state.set(`save_status`, {type: `error`, data: x}).set(`save_waiting`, false)
  })

  const save_waiting_r = inputs.save_waiting$.map(_ => state => {
    return state.set(`save_waiting`, true).set(`save_status`, undefined)
  })

  return O.merge(
    region_type_r, 
    clear_default_region_r, 
    default_waiting_r, 
    default_region_r,
    success_r, 
    error_r, 
    save_waiting_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      settings$: inputs.settings$.take(1),
      authorization$: inputs.Authorization.status$.take(1)
    })
    .switchMap((info: any) => {
      const {authorization, settings} = info

      return reducer$
        .startWith(Immutable.Map({
          authorization, 
          settings: clone(settings), 
          default_waiting: false, 
          is_valid: true, 
          save_waiting: false,
          save_status: undefined
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`component/settings state`, x))
    //.letBind(traceStartStop(`component/settings state trace`))
    .publishReplay(1).refCount()
}

function renderNavigator(state) {
  const {authorization} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid', [
    div('.row.no-gutter', [
      div('.col-xs-6', [
        button('.appBrandButton.hopscotch-icon.nav-brand', []),
      ]),
      div('.col-xs-6', [
        button('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.float-xs-right', []),
      ]),
    ])
  ])
}

function renderRegionMethodCombo(info) {
  const {state} = info
  const {settings} = state
  const {use_region} = settings
  const ul  = use_region

  //console.log(ul)
  return div(`.form-group`, [
    label({attrs: {for: 'defaultRegion'}}, [h6(['Region Method'])]),
    select('.appRegionComboBox.form-control', {attrs: {name: 'defaultRegion'}}, [
      option(`.combo-item`, {attrs: {value: `user`, selected: ul === `user`}}, [`Use my location`]),
      option(`.combo-item`, {attrs: {value: `default`, selected: ul === `default`}}, [`Use default region`])
    ])
  ])
}

function renderDefaultRegion(info) {
  const {state, components} = info
  const {settings} = state
  const {default_region} = settings
  if (default_region) {
    const {position, city_state} = default_region
    const {city, state_abbr} = city_state
    return div(`.row.clearfix`, [
      div('.col-xs-11', [
        span([`${city}, ${state_abbr}`])
      ]),
      div('.col-xs-1.float-xs-right', [
        button(`.appClearDefaultRegion.btn.btn-link.close`, {attrs: {type: 'button'}}, [])
      ])
    ])
  } else {
     const {defaultAutocomplete} = components
    return defaultAutocomplete
  }
}

function renderDefaultRegionSection(info) {
  return div(`.form-group`, [
    label([h6([`Default Region`])]),
    renderDefaultRegion(info)
  ])
}


function renderContent(info) {
  const {state, components} = info
  const {is_valid, save_status} = state
  const disabled = !is_valid
  return div(`.container-fluid.mt-1`, [
    save_status ? div(`.form-group`, [
      div(`.alerts-area`, [
        div(`.alert.${save_status.type === 'success' ? 'alert-success' : 'alert-danger'}`, [
          save_status.data
      ])])
    ]) : null,
    renderRegionMethodCombo(info),
    renderDefaultRegionSection(info),
    div(`.form-group`, [
      button(`.appSaveChanges.save-button`, {attrs: {type: 'button', disabled}}, [`Save`])
    ])
  ])
}

function view(state$, components) {
  return combineObj({
      state$,
      components$: combineObj(components)
    })
    .map((info: any) => {
      const {state} = info
      return div(`.screen`, [
        renderNavigator(state),
        renderContent(info)
      ])
    })
}


function main(sources, inputs) {
  const actions = intent(sources)

  const default_region$ = inputs.settings$
    .pluck(`default_region`)

  const defaultAutocomplete: any = isolate(createRegionAutocomplete)(sources, {...inputs, props$: default_region$})
  const save_waiting$ = createProxy()
  const state$ = model(actions, {
    ...inputs, 
    default_waiting$: defaultAutocomplete.waiting$,
    default_region$: defaultAutocomplete.output$,
    save_waiting$,
  })

  const save_local$ = state$.filter((state: any) => !state.authorization)
    .switchMap((state: any) => {
      return actions.save_changes$
        .map(_ => {
          //console.log(`saving settings local`)
          return state.settings
        })
    }).publish().refCount()

  const save_cloud$ = state$.filter((state: any) => !!state.authorization)
    .switchMap((state: any) => {
      return actions.save_changes$
        .map(_ => {
          //console.log(`saving settings cloud`)
          return {
            url: `/api/user`,
            method: `post`,
            category: `setApplicationSettings`,
            send: {
              route: `/settings`,
              data: state.settings
            }
          }
        })
    })
    .publish().refCount()

  const components = {
    defaultAutocomplete$: defaultAutocomplete.DOM
  }

  const vtree$ = view(state$, components)

  const toMessageBus$ = O.merge(
      O.merge(
        save_local$, 
        actions.success$
      )
        //.withLatestFrom(state$, (_, state) => {
        .map(settings => {
          //console.log(`state`, settings)
          return {
            to: `/services/settings`,
            message: settings
          }
        }),
      actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`})
    )
    //.do(x => console.log(`toMessageBus:`, x))
    .publish().refCount()

  //toMessageBus$.subscribe(x => console.log(`toMessageBus:`, x))

  const toHTTP$ = save_cloud$
  // .withLatestFrom(state$, (_, state) => {
  //   if (state.authorization) {
  //     return {
  //       url: `/api/user`,
  //       method: `post`,
  //       category: `setApplicationSettings`,
  //       send: {
  //         route: `/settings`,
  //         data: state.settings
  //       }
  //     }
  //   } else {
  //     return null
  //   }
  // })
  // .filter(x => !!x)
  // .publish().refCount()

  save_waiting$.attach(O.merge(toHTTP$))

  const out = {
    DOM: vtree$,
    HTTP: O.merge(
      toHTTP$,
      defaultAutocomplete.HTTP
    )
    //.do(x => console.log(`settings http`))
    .publish().refCount(),
    Router: O.merge(
      actions.brand_button$.mapTo('/')
    ),
    MessageBus: toMessageBus$
  }

  return out
}

export {
  main
}