import {Observable as O} from 'rxjs'
import {div, button, li, span, select, input, option} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, processHTTP, onlyError, onlySuccess, normalizeArcGISSingleLineToParts} from '../../utils'
import {renderMenuButton, renderLoginButton, renderUserProfileButton, renderSearchCalendarButton} from '../renderHelpers/controller'
import ArcGISSuggest from '../../thirdParty/ArcGISSuggest'
import ArcGISGetMagicKey from '../../thirdParty/ArcGISGetMagicKey'
import AutocompleteInput from '../../library/autocompleteInput'


function createRegionAutocomplete(sources, inputs, prop) {

  const center$ = inputs.settings$.pluck(prop).pluck(`position`)
  const itemConfigs = {
    default: {
      selectable: true,
      renderer: (suggestion, index, highlighted) => {
        return li(
          `.autocomplete-result${highlighted ? '.light-gray' : ''}`,
          {attrs: {'data-index': index}},
          [
            span(`.populated-place-info`, [suggestion.normalizedName])
          ]
        )
      }
    }
  }

  const results$ = createProxy()
  const autocompleteInput = AutocompleteInput(sources, {
    results$,
    itemConfigs,
    displayFunction: x => x.normalizedName,
    placeholder: `Type city/state here...`,
    styleClass: `.autocomplete-input`
  })

  const suggestionComponent = ArcGISSuggest(sources, {
    props$: combineObj({
      category: O.of('Populated+Place')
    }),
    center$: center$.distinctUntilChanged(),
    input$: autocompleteInput.input$
  })

  results$.attach(suggestionComponent.results$)

  const magicKeyComponent = ArcGISGetMagicKey(sources, {props$: O.of({category: `getGeocode`}), input$: autocompleteInput.selected$})

  const output$ = magicKeyComponent.result$
    .map(x => { 
      return {
        position: x.lngLat,
        geotag: normalizeArcGISSingleLineToParts(x.address)
      }
    })
    .publishReplay(1).refCount()

  const waiting$ = combineObj({
    suggestion: suggestionComponent.waiting$,
    magicKey: magicKeyComponent.waiting$
  }).map((info: any) => info.magicKey || info.suggestion)
  
  //waiting$.subscribe(x => console.log(`waiting`, x))

  return {
    ...mergeSinks(autocompleteInput, suggestionComponent, magicKeyComponent), 
    DOM: autocompleteInput.DOM,
    output$,
    waiting$
  }
}


function intent(sources) {
  const {DOM} = sources
  const {success$, error$} = processHTTP(sources, `setApplicationSettings`)
  const done$ = DOM.select(`.appDoneButton`).events(`click`)
  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  const show_login$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const show_user_profile$ = DOM.select(`.appShowUserProfileButton`).events(`click`)
    .publishReplay(1).refCount()

  const show_search_calendar$ = DOM.select(`.appShowSearchCalendarButton`).events(`click`)
    .publishReplay(1).refCount()

  const region_type$ = DOM.select(`.appRegionComboBox`).events(`change`)
    .map(ev => ev.target.value)

  const clear_override_region$ = DOM.select(`.appClearOverrideRegion`).events(`click`)
  const clear_home_region$ = DOM.select(`.appClearHomeRegion`).events(`click`)
    .publishReplay(1).refCount()

  const save_changes$ = DOM.select(`.appSaveChanges`).events(`click`)

  return {
    done$,
    success$,
    show_menu$,
    show_login$,
    show_user_profile$,
    show_search_calendar$,
    region_type$,
    clear_override_region$,
    clear_home_region$,
    save_changes$
  }
}

function getValidity({use_region, override_region, home_region}) {
  return !!(home_region && (use_region === `user` || override_region))
}

function reducers(actions, inputs) {
  const region_type_r = actions.region_type$.map(x => state => {
    const settings = state.get(`settings`)
    settings.use_region = x
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  const clear_override_region_r = actions.clear_override_region$.map(_ => state => {
    const settings = state.get(`settings`)
    settings.override_region = undefined
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  const override_waiting_r = inputs.override_waiting$.map(x => state => {
    return state.set(`region_waiting`, x)
  })

  const override_region_r = inputs.override_region$.map(x => state => {
    const settings = state.get(`settings`)
    settings.override_region = x
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  const clear_home_region_r = actions.clear_home_region$.map(_ => state => {
    const settings = state.get(`settings`)
    settings.home_region = undefined
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  const home_waiting_r = inputs.home_waiting$.map(x => state => {
    return state.set(`region_waiting`, x)
  })

  const home_region_r = inputs.home_region$.map(x => state => {
    const settings = state.get(`settings`)
    settings.home_region = x
    return state.set(`settings`, settings).set(`is_valid`, getValidity(settings))
  })

  return O.merge(
    region_type_r, 
    clear_override_region_r, override_waiting_r, override_region_r,
    clear_home_region_r, home_waiting_r, home_region_r
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
          authorization, settings, region_waiting: false, is_valid: true
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`settings state`, x))
    .publishReplay(1).refCount()
}

function renderController(state) {
  const {authorization} = state
  return div(`.controller`, [
    div(`.section`, [
      renderMenuButton()
    ]),
    div(`.section`, [
      renderSearchCalendarButton(),
      !authorization ? renderLoginButton() : null,
      authorization ? renderUserProfileButton() : null
    ])
  ])
}

function renderOverrideRegion(info) {
  const {state, components} = info
  const {settings} = state
  const {override_region} = settings
  if (override_region) {
    const {position, geotag} = override_region
    const {city, state_abbr} = geotag
    return div(`.display`, [
      span([`${city}, ${state_abbr}`]),
      button(`.appClearOverrideRegion.clear-button`, [])
    ])
  } else {
     const {overrideAutocomplete, homeAutocomplete} = components
    return div(`.autocomplete`, [
      overrideAutocomplete,
    ])
  }
}

function renderRegionSection(info) {
  const {state} = info
  const {settings} = state
  const {use_region} = settings
  const ul  = use_region

  //console.log(ul)
  return div(`.region-section`, [
    div(`.heading`, [`Region`]),
    select(`.appRegionComboBox.choice`, [
      option(`.combo-item`, {attrs: {value: `user`, selected: ul === `user`}}, [`Use my location`]),
      option(`.combo-item`, {attrs: {value: `manual`, selected: ul === `manual`}}, [`Choose manually`])
    ]),
    ul === "manual" ? div(`.override-region`, [renderOverrideRegion(info)]) : null
  ])
}

function renderHomeRegion(info) {
  const {state, components} = info
  const {settings} = state
  const {home_region} = settings
  if (home_region) {
    const {position, geotag} = home_region
    const {city, state_abbr} = geotag
    return div(`.display`, [
      span([`${city}, ${state_abbr}`]),
      button(`.appClearHomeRegion.clear-button`, [])
    ])
  } else {
     const {homeAutocomplete} = components
    return div(`.autocomplete`, [
      homeAutocomplete,
    ])
  }
}



function renderHomeRegionSection(info) {
  return div(`.home-region-section`, [
    div(`.heading`, [`Home`]),
    div(`.home-region`, [renderHomeRegion(info)])
  ])
}


function renderContent(info) {
  const {state, components} = info
  const {is_valid} = state
  const disabled = !is_valid
  return div(`.content.flex-center`, [
    renderRegionSection(info),
    renderHomeRegionSection(info),
    div(`.button-section`, [
      button(`.appSaveChanges.save-button`, {attrs: {disabled}}, [`Save`])
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
        renderController(state),
        renderContent(info)
      ])
    })
}


function main(sources, inputs) {
  const actions = intent(sources)

  const overrideAutocomplete = isolate(createRegionAutocomplete)(sources, inputs, `override_region`)

  const homeAutocomplete = isolate(createRegionAutocomplete)(sources, inputs, `home_region`)


  const state$ = model(actions, {
    ...inputs, 
    override_waiting$: overrideAutocomplete.waiting$,
    override_region$: overrideAutocomplete.output$,
    home_waiting$: homeAutocomplete.waiting$,
    home_region$: homeAutocomplete.output$
  })

  const components = {
    overrideAutocomplete$: overrideAutocomplete.DOM,
    homeAutocomplete$: homeAutocomplete.DOM
  }

  const vtree$ = view(state$, components)

  const toMessageBus$ = O.merge(
    actions.save_changes$.withLatestFrom(state$, (_, state) => {
      if (!state.authorization) {
        return {
          to: `/settings`,
          message: state.settings
        }
      } else {
        return null
      }
    })
    .filter(x => !!x),
    actions.success$
      //.withLatestFrom(state$, (_, state) => {
      .map(settings => {
        //console.log(`state`, settings)
        return {
          to: `/settings`,
          message: settings
        }
      }),
    actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`}),
    actions.show_login$.mapTo({to: `main`, message: `showLogin`})
  ).publish().refCount()

  //toMessageBus$.subscribe(x => console.log(`toMessageBus:`, x))


  return {
    DOM: vtree$,
    HTTP: O.merge(
      actions.save_changes$.withLatestFrom(state$, (_, state) => {
        if (state.authorization) {
          return {
            url: `/api/user`,
            method: `post`,
            category: `setApplicationSettings`,
            send: {
              route: `/settings`,
              data: state.settings
            }
          }
        } else {
          return null
        }
      })
      .filter(x => !!x),
      overrideAutocomplete.HTTP,
      homeAutocomplete.HTTP
    ),
    //.do(x => console.log(`suggester http`)),
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
}

export {
  main
}