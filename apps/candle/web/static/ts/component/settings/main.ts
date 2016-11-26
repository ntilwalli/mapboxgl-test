import {Observable as O} from 'rxjs'
import {div, button, li, span, select, input, option} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, processHTTP, traceStartStop, onlyError, onlySuccess, normalizeArcGISSingleLineToParts} from '../../utils'
import {renderMenuButton, renderCircleSpinner, renderLoginButton, renderUserProfileButton, renderSearchCalendarButton} from '../renderHelpers/navigator'
import ArcGISSuggest from '../../thirdParty/ArcGISSuggest'
import ArcGISGetMagicKey from '../../thirdParty/ArcGISGetMagicKey'
import AutocompleteInput from '../../library/autocompleteInput'
import {createRegionAutocomplete} from '../../library/regionAutocomplete'
import clone = require('clone')

function intent(sources) {
  const {DOM, MessageBus} = sources
  const {success$, error$} = processHTTP(sources, `setApplicationSettings`)
  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  const show_login$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const show_user_profile$ = DOM.select(`.appShowUserProfileButton`).events(`click`)
    .publishReplay(1).refCount()

  const show_search_calendar$ = DOM.select(`.appShowSearchCalendarButton`).events(`click`)
    .publishReplay(1).refCount()

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
    show_login$,
    show_user_profile$,
    show_search_calendar$,
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
  const {authorization, save_waiting, default_waiting} = state
  const waiting = !!(save_waiting || default_waiting)

  return div(`.navigator-section`, [
    div(`.section`, [
      renderMenuButton()
    ]),
    div(`.section`, [
      waiting ? renderCircleSpinner() : null,
      renderSearchCalendarButton(),
      !authorization ? renderLoginButton() : null,
      authorization ? renderUserProfileButton() : null
    ])
  ])
}

function renderRegionMethodCombo(info) {
  const {state} = info
  const {settings} = state
  const {use_region} = settings
  const ul  = use_region

  //console.log(ul)
  return div(`.region-combo-section`, [
    div(`.heading`, [`Region Method`]),
    select(`.appRegionComboBox.choice`, [
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
    return div(`.display`, [
      span([`${city}, ${state_abbr}`]),
      button(`.appClearDefaultRegion.clear-button`, [])
    ])
  } else {
     const {defaultAutocomplete} = components
    return div(`.autocomplete`, [
      defaultAutocomplete,
    ])
  }
}

function renderDefaultRegionSection(info) {
  return div(`.default-region-section`, [
    div(`.heading`, [`Default Region`]),
    div(`.default-region`, [renderDefaultRegion(info)])
  ])
}


function renderContent(info) {
  const {state, components} = info
  const {is_valid, save_status} = state
  const disabled = !is_valid
  return div(`.content-section`, [
    div(`.content`, [
      save_status ? div(`.status-section.${save_status.type}`, [save_status.data]) : null,
      renderRegionMethodCombo(info),
      renderDefaultRegionSection(info),
      div(`.button-section`, [
        button(`.appSaveChanges.save-button`, {attrs: {disabled}}, [`Save`])
      ])
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
      return div(`.settings-component.application`, [
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
      actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`}),
      actions.show_login$.mapTo({to: `main`, message: `showLogin`})
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
      actions.show_search_calendar$.mapTo({
        pathname: `/`,
        action: `push`
      }),
      actions.show_user_profile$.mapTo({
        pathname: `/home`,
        action: `PUSH`
      })
    ),
    MessageBus: toMessageBus$
  }

  return out
}

export {
  main
}